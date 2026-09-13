"use server";

import { revalidatePath } from "next/cache";
import {
  AssignmentStatus,
  EventStatus,
  TaskMode,
  TaskStatus,
  Prisma,
} from "@prisma/client";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";

export type ClaimResult = { ok: true; message?: string } | { ok: false; error: string };

type Tx = Prisma.TransactionClient;

/**
 * Lock the task row for the duration of the claim decision.
 * Two volunteers clicking "I'm ready" at the same millisecond must NOT both
 * get a slot when only one remains — this row lock serializes their
 * count-then-create, so overbooking is impossible.
 */
async function lockTask(tx: Tx, taskId: string) {
  await tx.$queryRaw`SELECT id FROM "Task" WHERE id = ${taskId} FOR UPDATE`;
}

async function getTaskForSignup(tx: Tx, taskId: string) {
  const task = await tx.task.findUnique({
    where: { id: taskId },
    include: { event: { select: { id: true, status: true } } },
  });
  if (!task) throw new Error("Task not found.");
  if (
    task.event.status !== EventStatus.PUBLISHED &&
    task.event.status !== EventStatus.ONGOING
  ) {
    throw new Error("This event is not accepting sign-ups.");
  }
  if (task.status !== TaskStatus.OPEN) throw new Error("This task is closed.");
  return task;
}

async function assertCapacity(tx: Tx, taskId: string, requiredVolunteers: number) {
  const confirmed = await tx.taskAssignment.count({
    where: { taskId, status: AssignmentStatus.CONFIRMED },
  });
  if (confirmed >= requiredVolunteers) {
    throw new Error("All slots are taken — this task just filled up.");
  }
}

function revalidateForEvent(eventId: string) {
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function claimTask(taskId: string): Promise<ClaimResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to volunteer." };
  if (user.role !== "VOLUNTEER") {
    return { ok: false, error: "Only volunteer accounts can sign up for tasks." };
  }

  let eventId: string;
  try {
    eventId = await db.$transaction(async (tx) => {
      await lockTask(tx, taskId);
      const task = await getTaskForSignup(tx, taskId);
      if (task.mode !== TaskMode.INSTANT_CLAIM) {
        throw new Error("This task needs organizer approval — use Apply instead.");
      }
      await assertCapacity(tx, taskId, task.requiredVolunteers);
      await tx.taskAssignment.create({
        data: { taskId, volunteerId: user.id, status: AssignmentStatus.CONFIRMED },
      });
      return task.event.id;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "You're already signed up for this task." };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidateForEvent(eventId);
  return { ok: true, message: "You're in! See you there." };
}

export async function applyToTask(taskId: string, note?: string): Promise<ClaimResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in to volunteer." };
  if (user.role !== "VOLUNTEER") {
    return { ok: false, error: "Only volunteer accounts can apply for tasks." };
  }

  let eventId: string;
  try {
    eventId = await db.$transaction(async (tx) => {
      await lockTask(tx, taskId);
      const task = await getTaskForSignup(tx, taskId);
      if (task.mode !== TaskMode.APPROVAL) {
        throw new Error("This task is instant-claim — no approval needed.");
      }
      // Applying doesn't consume a slot; capacity is re-checked at approval time.
      await tx.taskAssignment.create({
        data: {
          taskId,
          volunteerId: user.id,
          status: AssignmentStatus.PENDING,
          note: note?.trim() || null,
        },
      });
      return task.event.id;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "You've already applied to this task." };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidateForEvent(eventId);
  return { ok: true, message: "Application sent — the organizer will review it." };
}

export async function cancelSignup(assignmentId: string): Promise<ClaimResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  const assignment = await db.taskAssignment.findUnique({
    where: { id: assignmentId },
    include: { task: { include: { event: { select: { id: true, status: true } } } } },
  });
  if (!assignment || assignment.volunteerId !== user.id) {
    return { ok: false, error: "Sign-up not found." };
  }
  if (
    assignment.status !== AssignmentStatus.PENDING &&
    assignment.status !== AssignmentStatus.CONFIRMED
  ) {
    return { ok: false, error: "This sign-up can no longer be cancelled." };
  }
  if (assignment.task.event.status === EventStatus.COMPLETED) {
    return { ok: false, error: "This event has already finished." };
  }

  await db.taskAssignment.update({
    where: { id: assignmentId },
    data: { status: AssignmentStatus.CANCELLED },
  });

  revalidateForEvent(assignment.task.event.id);
  return { ok: true, message: "Sign-up cancelled." };
}

export async function approveAssignment(assignmentId: string): Promise<ClaimResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ORGANIZER") {
    return { ok: false, error: "Only organizers can approve applications." };
  }

  let eventId: string;
  try {
    eventId = await db.$transaction(async (tx) => {
      const assignment = await tx.taskAssignment.findUnique({
        where: { id: assignmentId },
        include: {
          task: {
            include: { event: { select: { id: true, organizerId: true } } },
          },
        },
      });
      if (!assignment || assignment.task.event.organizerId !== user.id) {
        throw new Error("Application not found.");
      }
      if (assignment.status !== AssignmentStatus.PENDING) {
        throw new Error("This application was already handled.");
      }
      await lockTask(tx, assignment.taskId);
      // The slot check lives HERE, not at apply time — approving is what fills the slot.
      await assertCapacity(tx, assignment.taskId, assignment.task.requiredVolunteers);
      await tx.taskAssignment.update({
        where: { id: assignmentId },
        data: { status: AssignmentStatus.CONFIRMED },
      });
      return assignment.task.event.id;
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Something went wrong." };
  }

  revalidateForEvent(eventId);
  return { ok: true, message: "Volunteer confirmed." };
}

export async function rejectAssignment(assignmentId: string): Promise<ClaimResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ORGANIZER") {
    return { ok: false, error: "Only organizers can reject applications." };
  }

  const assignment = await db.taskAssignment.findUnique({
    where: { id: assignmentId },
    include: { task: { include: { event: { select: { id: true, organizerId: true } } } } },
  });
  if (!assignment || assignment.task.event.organizerId !== user.id) {
    return { ok: false, error: "Application not found." };
  }
  if (assignment.status !== AssignmentStatus.PENDING) {
    return { ok: false, error: "This application was already handled." };
  }

  await db.taskAssignment.update({
    where: { id: assignmentId },
    data: { status: AssignmentStatus.CANCELLED },
  });

  revalidateForEvent(assignment.task.event.id);
  return { ok: true, message: "Application rejected." };
}

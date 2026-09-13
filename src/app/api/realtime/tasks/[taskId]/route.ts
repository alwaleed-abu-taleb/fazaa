import { NextResponse, type NextRequest } from "next/server";
import { AssignmentStatus } from "@prisma/client";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ taskId: string }> };

/**
 * Live snapshot of one task for the polling hook.
 * Slot counts are public (same data the event page renders); the viewer's own
 * assignment is only included for a signed-in user.
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { taskId } = await params;

  const task = await db.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      requiredVolunteers: true,
      status: true,
      mode: true,
      event: { select: { status: true } },
      _count: {
        select: { assignments: { where: { status: AssignmentStatus.CONFIRMED } } },
      },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const session = await auth();
  const myAssignment = session?.user
    ? await db.taskAssignment.findFirst({
        where: { taskId, volunteerId: session.user.id },
        select: { id: true, status: true },
      })
    : null;

  return NextResponse.json({
    taskId: task.id,
    claimed: task._count.assignments,
    total: task.requiredVolunteers,
    status: task.status,
    mode: task.mode,
    eventStatus: task.event.status,
    myAssignment,
  });
}

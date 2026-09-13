import { AssignmentStatus, EventStatus } from "@prisma/client";
import { db } from "@/server/db";

export async function getOrganizerEvents(organizerId: string) {
  const events = await db.event.findMany({
    where: { organizerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      category: true,
      city: true,
      startsAt: true,
      tasks: { select: { id: true, requiredVolunteers: true, mode: true, status: true } },
    },
  });

  if (events.length === 0) return [];

  // One grouped query for sign-up counts across all of the organizer's tasks.
  const taskIds = events.flatMap((e) => e.tasks.map((t) => t.id));
  const counts = await db.taskAssignment.groupBy({
    by: ["taskId", "status"],
    where: {
      taskId: { in: taskIds },
      status: { in: [AssignmentStatus.CONFIRMED, AssignmentStatus.PENDING] },
    },
    _count: { _all: true },
  });

  const byTask = new Map<string, { confirmed: number; pending: number }>();
  for (const row of counts) {
    const entry = byTask.get(row.taskId) ?? { confirmed: 0, pending: 0 };
    if (row.status === AssignmentStatus.CONFIRMED) entry.confirmed = row._count._all;
    if (row.status === AssignmentStatus.PENDING) entry.pending = row._count._all;
    byTask.set(row.taskId, entry);
  }

  return events.map((e) => {
    let slotsNeeded = 0;
    let slotsFilled = 0;
    let pending = 0;
    for (const t of e.tasks) {
      const c = byTask.get(t.id) ?? { confirmed: 0, pending: 0 };
      slotsNeeded += t.requiredVolunteers;
      slotsFilled += c.confirmed;
      pending += c.pending;
    }
    return { ...e, slotsNeeded, slotsFilled, pendingCount: pending, taskCount: e.tasks.length };
  });
}

export async function getEventTracker(eventId: string, organizerId: string) {
  const event = await db.event.findFirst({
    where: { id: eventId, organizerId },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      category: true,
      city: true,
      location: true,
      startsAt: true,
      endsAt: true,
      organizer: { select: { organizerProfile: { select: { isVerified: true } } } },
      tasks: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          requiredVolunteers: true,
          mode: true,
          status: true,
          _count: { select: { assignments: { where: { status: AssignmentStatus.CONFIRMED } } } },
          assignments: {
            where: { status: { in: [AssignmentStatus.PENDING, AssignmentStatus.CONFIRMED] } },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              status: true,
              note: true,
              createdAt: true,
              volunteer: { select: { id: true, name: true, phone: true, email: true } },
            },
          },
        },
      },
    },
  });
  return event;
}

export async function getVolunteerActivities(volunteerId: string) {
  const assignments = await db.taskAssignment.findMany({
    where: {
      volunteerId,
      status: { in: [AssignmentStatus.PENDING, AssignmentStatus.CONFIRMED] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          requiredVolunteers: true,
          event: {
            select: {
              id: true,
              title: true,
              city: true,
              category: true,
              status: true,
              startsAt: true,
              organizer: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  const now = Date.now();
  const isUpcoming = (a: (typeof assignments)[number]) =>
    a.task.event.startsAt.getTime() >= now &&
    (a.task.event.status === EventStatus.PUBLISHED || a.task.event.status === EventStatus.ONGOING);
  const upcoming = assignments.filter(isUpcoming);
  const past = assignments.filter((a) => !isUpcoming(a));
  return { upcoming, past };
}

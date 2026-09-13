import { AssignmentStatus, EventCategory, EventStatus } from "@prisma/client";
import { db } from "@/server/db";
import { eventCategoryValues } from "@/features/events/schemas";
import type { SessionUser } from "@/server/auth";

/**
 * Capacity is DERIVED: a task's filled slots are its CONFIRMED assignments.
 * Never denormalize this into a counter column.
 */
const confirmedCount = {
  _count: {
    select: { assignments: { where: { status: AssignmentStatus.CONFIRMED } } },
  },
} as const;

export type EventListItem = Awaited<ReturnType<typeof getBrowseEvents>>[number];

export function summarizeSlots(
  tasks: { requiredVolunteers: number; _count: { assignments: number } }[],
) {
  return {
    slotsNeeded: tasks.reduce((sum, t) => sum + t.requiredVolunteers, 0),
    slotsFilled: tasks.reduce((sum, t) => sum + t._count.assignments, 0),
  };
}

export async function getFeaturedEvents() {
  const events = await db.event.findMany({
    where: { status: EventStatus.PUBLISHED, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 3,
    select: {
      id: true,
      title: true,
      slug: true,
      city: true,
      category: true,
      startsAt: true,
      cityObj: { select: { name: true, arabic: true } },
      district: { select: { name: true, arabic: true } },
      organizer: {
        select: {
          name: true,
          organizerProfile: { select: { orgName: true, isVerified: true } },
        },
      },
      tasks: { select: { requiredVolunteers: true, ...confirmedCount } },
    },
  });
  return events.map((e) => ({ ...e, ...summarizeSlots(e.tasks) }));
}

export async function getBrowseEvents(
  filters: {
    q?: string;
    cityId?: string;
    districtId?: string;
    category?: string;
  },
  preferredCityId?: string,
) {
  const events = await db.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      startsAt: { gte: new Date() },
      ...(filters.cityId ? { cityId: filters.cityId } : {}),
      ...(filters.districtId ? { districtId: filters.districtId } : {}),
      ...(filters.category && eventCategoryValues.includes(filters.category as never)
        ? { category: filters.category as EventCategory }
        : {}),
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { description: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      city: true,
      cityId: true,
      category: true,
      startsAt: true,
      cityObj: { select: { name: true, arabic: true } },
      district: { select: { name: true, arabic: true } },
      organizer: {
        select: {
          name: true,
          organizerProfile: { select: { orgName: true, isVerified: true } },
        },
      },
      tasks: { select: { requiredVolunteers: true, ...confirmedCount } },
    },
  });
  const withSlots = events.map((e) => ({ ...e, ...summarizeSlots(e.tasks) }));

  // Personalization: the volunteer's preferred city floats to the top (each
  // group keeps its date order). Explicit city filters skip this entirely.
  if (!preferredCityId) return withSlots;
  const inPreferred = withSlots.filter((e) => e.cityId === preferredCityId);
  const everywhereElse = withSlots.filter((e) => e.cityId !== preferredCityId);
  return [...inPreferred, ...everywhereElse];
}

export async function getFilterCities() {
  const rows = await db.event.findMany({
    where: { status: EventStatus.PUBLISHED, startsAt: { gte: new Date() } },
    select: { city: true },
    distinct: ["city"],
    orderBy: { city: "asc" },
  });
  return rows.map((r) => r.city).filter((c): c is string => !!c);
}

export async function getEventForView(eventId: string, viewer: SessionUser | null) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          organizerProfile: { select: { orgName: true, isVerified: true } },
        },
      },
      cityObj: { select: { name: true, arabic: true } },
      district: { select: { name: true, arabic: true } },
      tasks: {
        orderBy: { createdAt: "asc" },
        include: {
          ...confirmedCount,
          // The viewer's own signup row per task (if any) — powers the button states.
          // Always included (empty for anonymous viewers) so the page type stays stable.
          assignments: {
            where: { volunteerId: viewer?.id ?? "no-viewer" },
            select: { id: true, status: true },
          },
        },
      },
    },
  });

  if (!event) return null;

  const isOwner = viewer?.role === "ORGANIZER" && viewer.id === event.organizerId;
  const isPubliclyVisible =
    event.status === EventStatus.PUBLISHED || event.status === EventStatus.ONGOING;
  if (!isPubliclyVisible && !isOwner) return null;

  return { ...event, isOwner };
}

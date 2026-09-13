"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EventStatus, TaskStatus, AssignmentStatus } from "@prisma/client";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { eventFormSchema } from "@/features/events/schemas";
import { ActionError, fail } from "@/server/errors";

export type EventFormState = { error?: string };

function slugify(input: string) {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return base || "event";
}

function randomSuffix() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
}

export async function createEventAction(
  _prev: EventFormState,
  formData: FormData,
): Promise<EventFormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER") {
    return fail("Only organizer accounts can create events.");
  }

  let tasksRaw: unknown;
  try {
    tasksRaw = JSON.parse(String(formData.get("tasks") ?? "[]"));
  } catch {
    return fail("Something went wrong reading the tasks — try again.");
  }

  const parsed = eventFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    cityId: formData.get("cityId"),
    districtId: formData.get("districtId") || undefined,
    location: formData.get("location"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt") || undefined,
    coverImageUrl: formData.get("coverImageUrl") || undefined,
    tasks: tasksRaw,
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }

  // Resolve the Jordan location: district must belong to the chosen city, and
  // the display string denormalizes City.name for legacy consumers.
  const city = await db.city.findUnique({
    where: { id: parsed.data.cityId },
    select: { id: true, name: true },
  });
  if (!city) return fail("Choose a valid city.");

  let districtId: string | null = null;
  if (parsed.data.districtId) {
    const district = await db.district.findUnique({
      where: { id: parsed.data.districtId },
      select: { id: true, cityId: true },
    });
    if (!district || district.cityId !== city.id) {
      return fail("The selected district doesn't belong to the selected city.");
    }
    districtId = district.id;
  }

  // cityId travels inside eventFields but is overridden by the explicit
  // `cityId: city.id` below after the spread.
  const { tasks, endsAt, coverImageUrl, ...eventFields } = parsed.data;

  // Event + its tasks go in atomically — a half-created event is never visible.
  const event = await db.event.create({
    data: {
      ...eventFields,
      city: city.name,
      cityId: city.id,
      districtId,
      endsAt: endsAt ?? null,
      coverImageUrl: coverImageUrl ?? null,
      slug: `${slugify(eventFields.title)}-${randomSuffix()}`,
      organizerId: user.id,
      status: EventStatus.DRAFT,
      tasks: {
        create: tasks.map((t) => ({
          title: t.title,
          description: t.description || null,
          requiredVolunteers: t.requiredVolunteers,
          mode: t.mode,
          status: TaskStatus.OPEN,
        })),
      },
    },
    select: { id: true },
  });

  revalidatePath("/events");
  revalidatePath("/dashboard");
  redirect(`/dashboard/events/${event.id}`);
}

async function requireOwnedEvent(eventId: string, userId: string) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    select: { id: true, organizerId: true, status: true },
  });
  if (!event) throw new ActionError("Event not found.");
  if (event.organizerId !== userId) throw new ActionError("You don't own this event.");
  return event;
}

export async function publishEventAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER") throw new ActionError("Only organizers can publish events.");

  const eventId = String(formData.get("eventId") ?? "");
  const event = await requireOwnedEvent(eventId, user.id);
  if (event.status !== EventStatus.DRAFT) {
    throw new ActionError("Only draft events can be published.");
  }

  // Verified organizations only — verification documents are reviewed by admins.
  const organizer = await db.user.findUnique({
    where: { id: user.id },
    select: { organizerProfile: { select: { isVerified: true } } },
  });
  if (!organizer?.organizerProfile?.isVerified) {
    redirect(`/dashboard/events/${eventId}?publishBlocked=1`);
  }

  await db.event.update({ where: { id: eventId }, data: { status: EventStatus.PUBLISHED } });
  revalidatePath("/events");
  revalidatePath("/dashboard");
  redirect(`/dashboard/events/${eventId}`);
}

export async function cancelEventAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER") throw new ActionError("Only organizers can cancel events.");

  const eventId = String(formData.get("eventId") ?? "");
  const event = await requireOwnedEvent(eventId, user.id);
  if (event.status === EventStatus.CANCELLED || event.status === EventStatus.COMPLETED) {
    throw new ActionError("This event can no longer be cancelled.");
  }

  // Cancelling an event closes its tasks and releases everyone's sign-ups.
  await db.$transaction([
    db.event.update({ where: { id: eventId }, data: { status: EventStatus.CANCELLED } }),
    db.task.updateMany({ where: { eventId }, data: { status: TaskStatus.CLOSED } }),
    db.taskAssignment.updateMany({
      where: {
        task: { eventId },
        status: { in: [AssignmentStatus.PENDING, AssignmentStatus.CONFIRMED] },
      },
      data: { status: AssignmentStatus.CANCELLED },
    }),
  ]);

  revalidatePath("/events");
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/events/${eventId}`);
  redirect(`/dashboard/events/${eventId}`);
}

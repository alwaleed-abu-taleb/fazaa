import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, CalendarDays, MapPin } from "lucide-react";
import { EventStatus } from "@prisma/client";
import { getCurrentUser } from "@/server/auth";
import { getEventForView } from "@/features/events/queries";
import {
  EventStatusBadge,
  CategoryBadge,
} from "@/features/events/components/badges";
import { TaskCard } from "@/features/tasks/components/TaskCard";
import { VerificationBadge } from "@/features/verification/components/VerificationBadge";
import { formatWindow } from "@/lib/format";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getEventForView(eventId, null);
  return { title: event?.title ?? "Event" };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const user = await getCurrentUser();
  const event = await getEventForView(eventId, user);
  if (!event) notFound();

  const acceptsSignups =
    event.status === EventStatus.PUBLISHED || event.status === EventStatus.ONGOING;
  const canSignup = user?.role === "VOLUNTEER" && acceptsSignups;

  return (
    <div className="max-w-[56rem]">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All events
      </Link>

      <div className="mt-6 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={event.category} />
          {(event.isOwner || event.status !== EventStatus.PUBLISHED) && (
            <EventStatusBadge status={event.status} />
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{event.title}</h1>
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
          <span className="flex items-center gap-1.5">
            <Building2 className="size-4" />
            {event.organizer.organizerProfile?.orgName ?? event.organizer.name}
            <VerificationBadge verified={event.organizer.organizerProfile?.isVerified ?? false} />
          </span>
          <span className="flex flex-wrap items-center gap-1.5">
            <MapPin className="size-4" />
            {[event.cityObj?.name ?? event.city, event.district?.name].filter(Boolean).join(" — ") ||
              "Location TBA"}
            {(event.district?.arabic ?? event.cityObj?.arabic) && (
              <span className="text-muted-foreground/70">
                ({event.district?.arabic ?? event.cityObj?.arabic})
              </span>
            )}
            {event.location && (
              <span className="text-muted-foreground">· {event.location}</span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" />
            {formatWindow(event.startsAt, event.endsAt)}
          </span>
        </div>
      </div>

      {event.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.coverImageUrl}
          alt={event.title}
          className="mt-6 aspect-[21/9] w-full rounded-xl border object-cover"
        />
      )}

      {event.isOwner && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-accent/50 px-4 py-3">
          <p className="text-sm">
            <span className="font-medium">You organize this event.</span>{" "}
            {event.status === EventStatus.DRAFT
              ? "It's still a draft — publish it to start collecting sign-ups."
              : "Track sign-ups and manage the roster from your dashboard."}
          </p>
          <Button size="sm" asChild>
            <Link href={`/dashboard/events/${event.id}`}>Manage event</Link>
          </Button>
        </div>
      )}

      <div className="mt-8 whitespace-pre-line leading-relaxed text-foreground/90">
        {event.description}
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">
          Volunteer tasks{" "}
          <span className="font-normal text-muted-foreground">({event.tasks.length})</span>
        </h2>

        {event.tasks.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {event.tasks.map((task) => (
              <TaskCard
                key={task.id}
                eventId={event.id}
                canSignup={canSignup}
                task={{
                  id: task.id,
                  title: task.title,
                  description: task.description,
                  requiredVolunteers: task.requiredVolunteers,
                  mode: task.mode,
                  status: task.status,
                  confirmedCount: task._count.assignments,
                  myAssignment: task.assignments[0] ?? null,
                }}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            The organizer hasn&rsquo;t published any tasks yet.
          </p>
        )}

        {!user && acceptsSignups && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Sign in to claim a spot on these tasks.
            </p>
            <Button size="sm" asChild>
              <Link href="/login">Sign in to volunteer</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

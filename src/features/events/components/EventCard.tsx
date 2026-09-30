import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import type { EventCategory } from "@prisma/client";
import { VerificationBadge } from "@/features/verification/components/VerificationBadge";
import { formatDate } from "@/lib/format";

type EventCardProps = {
  id: string;
  title: string;
  city: string | null;
  districtName?: string | null;
  category: EventCategory;
  startsAt: Date;
  organizerName: string;
  organizerVerified?: boolean;
  slotsFilled: number;
  slotsNeeded: number;
  /** Optional status badge + action buttons (dashboard join/edit/delete). */
  status?: import("@prisma/client").EventStatus;
  actions?: React.ReactNode;
};

export function EventCard({
  id,
  title,
  city,
  districtName,
  startsAt,
  organizerName,
  organizerVerified,
  slotsFilled,
  slotsNeeded,
  status,
  actions,
}: EventCardProps) {
  const published = status === "PUBLISHED" || status === "ONGOING";

  return (
    <div className="group relative flex h-full flex-col rounded-card border border-border bg-card shadow-subtle transition-colors hover:bg-gray-light">
      <Link href={`/events/${id}`} className="flex flex-1 flex-col outline-none" aria-label={title}>
        <div className="flex items-start justify-between gap-2 border-b border-border p-4 pb-3">
          <h3 className="line-clamp-2 text-h3 font-semibold leading-snug group-hover:text-crimson">
            {title}
          </h3>
          {status && (
            <span
              className={
                published
                  ? "shrink-0 rounded-full bg-growth/15 px-2 py-0.5 text-caption font-medium text-growth"
                  : "shrink-0 rounded-full bg-gray-light px-2 py-0.5 text-caption font-medium text-gray-dark"
              }
            >
              {published ? "منشور" : "مسودة"}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {city ?? "—"}
              {districtName ? <span className="text-muted-foreground/70"> — {districtName}</span> : null}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {formatDate(startsAt)}
            </span>
          </div>
          <span className="flex min-w-0 items-center gap-1 text-body text-muted-foreground">
            <span className="truncate">by {organizerName}</span>
            <VerificationBadge verified={organizerVerified ?? false} />
          </span>
        </div>
      </Link>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border p-4 pt-3">
        <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <Users className="size-3.5" />
          {slotsFilled} / {slotsNeeded} متطوع
        </span>
        {actions}
      </div>
    </div>
  );
}

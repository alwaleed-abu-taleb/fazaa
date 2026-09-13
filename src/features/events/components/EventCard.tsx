import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import type { EventCategory } from "@prisma/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CategoryBadge } from "@/features/events/components/badges";
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
};

export function EventCard({
  id,
  title,
  city,
  districtName,
  category,
  startsAt,
  organizerName,
  organizerVerified,
  slotsFilled,
  slotsNeeded,
}: EventCardProps) {
  const pct = slotsNeeded > 0 ? Math.min(100, Math.round((slotsFilled / slotsNeeded) * 100)) : 0;

  return (
    <Link href={`/events/${id}`} className="group block h-full outline-none">
      <Card className="h-full transition-all group-hover:border-primary/40 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardHeader className="pb-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <CategoryBadge category={category} />
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {formatDate(startsAt)}
            </span>
          </div>
          <CardTitle className="line-clamp-2 text-lg leading-snug group-hover:text-primary">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {city ?? "—"}
              {districtName ? <span className="text-muted-foreground/70"> — {districtName}</span> : null}
            </span>
            <span className="flex min-w-0 items-center gap-1">
              <span className="truncate">by {organizerName}</span>
              <VerificationBadge verified={organizerVerified ?? false} />
            </span>
          </div>
        </CardContent>
        <CardFooter className="mt-auto flex-col items-stretch gap-2 border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3.5" />
              {slotsFilled} of {slotsNeeded} ready
            </span>
            <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </CardFooter>
      </Card>
    </Link>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ClipboardList, MapPin, Plus, Users } from "lucide-react";
import { AssignmentStatus, EventStatus } from "@prisma/client";
import { getCurrentUser } from "@/server/auth";
import { getOrganizerEvents, getVolunteerActivities } from "@/features/dashboard/queries";
import { getUserVerificationStatus } from "@/features/verification/queries";
import { EventStatusBadge, CategoryBadge } from "@/features/events/components/badges";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">
        {user.role === "ORGANIZER" ? "Organizer dashboard" : "My activities"}
      </h1>
      <p className="mt-1 text-muted-foreground">
        {user.role === "ORGANIZER"
          ? "Track your events, fill rates and pending applications."
          : "Everything you've signed up for, in one place."}
      </p>

      <div className="mt-8">
        {user.role === "ORGANIZER" ? <OrganizerView userId={user.id} /> : <VolunteerView userId={user.id} />}
      </div>
    </div>
  );
}

async function OrganizerView({ userId }: { userId: string }) {
  const events = await getOrganizerEvents(userId);
  const verification = await getUserVerificationStatus(userId);
  const totals = events.reduce(
    (acc, e) => ({
      confirmed: acc.confirmed + e.slotsFilled,
      pending: acc.pending + e.pendingCount,
      live: acc.live + (e.status === EventStatus.PUBLISHED || e.status === EventStatus.ONGOING ? 1 : 0),
    }),
    { confirmed: 0, pending: 0, live: 0 },
  );

  return (
    <div className="space-y-8">
      {!verification.isVerified && (
        <Alert>
          <ShieldCheck className="size-4" />
          <AlertTitle>Your organization isn&rsquo;t verified yet</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>Organizers must be verified before they can publish events.</span>
            <Button size="sm" variant="outline" asChild>
              <Link href="/verify">Get verified</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={ClipboardList} label="Live events" value={String(totals.live)} />
          <StatCard icon={Users} label="Volunteers confirmed" value={String(totals.confirmed)} />
          <StatCard icon={CalendarDays} label="Pending applications" value={String(totals.pending)} highlight={totals.pending > 0} />
        </div>
        <Button asChild>
          <Link href="/events/new">
            <Plus className="size-4" /> New event
          </Link>
        </Button>
      </div>

      {events.length > 0 ? (
        <ul className="divide-y rounded-lg border bg-card">
          {events.map((e) => {
            const pct = e.slotsNeeded > 0 ? Math.round((e.slotsFilled / e.slotsNeeded) * 100) : 0;
            return (
              <li key={e.id} className="p-4 sm:px-6">
                <Link href={`/dashboard/events/${e.id}`} className="group block">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium group-hover:text-primary">{e.title}</span>
                      <EventStatusBadge status={e.status} />
                      {e.pendingCount > 0 && (
                        <Badge className="bg-amber-500/15 text-amber-700 border-transparent hover:bg-amber-500/15">
                          {e.pendingCount} pending approval{e.pendingCount === 1 ? "" : "s"}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(e.startsAt)} · {e.city ?? "—"}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={pct} className="h-2 flex-1" />
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {e.slotsFilled}/{e.slotsNeeded} slots · {e.taskCount} task{e.taskCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">You haven&rsquo;t created any events yet.</p>
          <Button className="mt-4" variant="outline" asChild>
            <Link href="/events/new">Create your first event</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

async function VolunteerView({ userId }: { userId: string }) {
  const { upcoming, past } = await getVolunteerActivities(userId);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-semibold tracking-tight">Upcoming</h2>
        {upcoming.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {upcoming.map((a) => (
              <ActivityRow key={a.id} assignment={a} />
            ))}
          </ul>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed p-10 text-center">
            <p className="text-muted-foreground">No upcoming sign-ups yet — someone out there needs a hand.</p>
            <Button className="mt-4" variant="outline" asChild>
              <Link href="/events">Browse events</Link>
            </Button>
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold tracking-tight">Past</h2>
          <ul className="mt-3 space-y-3 opacity-75">
            {past.map((a) => (
              <ActivityRow key={a.id} assignment={a} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

type ActivityAssignment = Awaited<ReturnType<typeof getVolunteerActivities>>["upcoming"][number];

function ActivityRow({ assignment: a }: { assignment: ActivityAssignment }) {
  return (
    <li>
      <Link
        href={`/events/${a.task.event.id}`}
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{a.task.event.title}</span>
            <CategoryBadge category={a.task.event.category} />
            {a.status === AssignmentStatus.CONFIRMED ? (
              <Badge className="bg-primary/10 text-primary border-transparent hover:bg-primary/10">
                Confirmed
              </Badge>
            ) : (
              <Badge className="bg-amber-500/15 text-amber-700 border-transparent hover:bg-amber-500/15">
                Awaiting approval
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Task: {a.task.title} · by {a.task.event.organizer.name}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          {formatDate(a.task.event.startsAt)}
          {a.task.event.city ? ` · ${a.task.event.city}` : null}
          <MapPin className="ml-1 hidden size-0" />
        </span>
      </Link>
    </li>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${highlight ? "border-amber-500/40" : ""}`}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <p className={`mt-1 text-2xl font-bold ${highlight ? "text-amber-700" : ""}`}>{value}</p>
    </div>
  );
}

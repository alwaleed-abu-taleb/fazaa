import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { Ban, Phone, Send, ShieldAlert, Users } from "lucide-react";
import { AssignmentStatus, EventStatus } from "@prisma/client";
import { getCurrentUser } from "@/server/auth";
import { getEventTracker } from "@/features/dashboard/queries";
import {
  cancelEventAction,
  publishEventAction,
} from "@/features/events/actions";
import { EventStatusBadge, CategoryBadge } from "@/features/events/components/badges";
import { ApprovalButtons } from "@/features/dashboard/components/ApprovalButtons";
import { ExportButton } from "@/features/export/components/ExportButton";
import { taskModeLabels } from "@/features/events/schemas";
import { formatWindow } from "@/lib/format";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Event tracker" };

export default async function EventTrackerPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { eventId } = await params;
  const sp = await searchParams;
  const publishBlocked = sp.publishBlocked === "1";
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER") redirect("/dashboard");

  const event = await getEventTracker(eventId, user.id);
  if (!event) notFound();
  const isVerified = event.organizer.organizerProfile?.isVerified ?? false;

  const totals = event.tasks.reduce(
    (acc, t) => ({
      needed: acc.needed + t.requiredVolunteers,
      filled: acc.filled + t._count.assignments,
      pending: acc.pending + t.assignments.filter((a) => a.status === AssignmentStatus.PENDING).length,
    }),
    { needed: 0, filled: 0, pending: 0 },
  );

  const pendingApprovals = event.tasks.flatMap((t) =>
    t.assignments
      .filter((a) => a.status === AssignmentStatus.PENDING)
      .map((a) => ({ ...a, taskTitle: t.title })),
  );

  return (
    <div className="max-w-[64rem]">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: event.title },
        ]}
      />

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={event.category} />
            <EventStatusBadge status={event.status} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{event.title}</h1>
          <p className="text-sm text-muted-foreground">
            {formatWindow(event.startsAt, event.endsAt)}
            {event.city ? ` · ${[event.city, event.location].filter(Boolean).join(" — ")}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ExportButton
            eventId={event.id}
            tasks={event.tasks.map((t) => ({ id: t.id, title: t.title }))}
          />
          {event.status === EventStatus.DRAFT && (
            isVerified ? (
              <form action={publishEventAction}>
                <input type="hidden" name="eventId" value={event.id} />
                <Button type="submit">
                  <Send className="size-4" /> Publish event
                </Button>
              </form>
            ) : (
              <Button disabled title="Verify your organization to publish">
                <Send className="size-4" /> Publish event
              </Button>
            )
          )}
          {(event.status === EventStatus.DRAFT || event.status === EventStatus.PUBLISHED) && (
            <form action={cancelEventAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <Button type="submit" variant="outline" className="text-destructive">
                <Ban className="size-4" /> Cancel event
              </Button>
            </form>
          )}
        </div>
      </div>

      {publishBlocked && (
        <Alert variant="destructive" className="mt-6">
          <ShieldAlert className="size-4" />
          <AlertTitle>Publishing is locked until your organization is verified</AlertTitle>
          <AlertDescription>
            Upload your NGO license or official ID from the{" "}
            <Link href="/verify" className="font-medium underline underline-offset-4">
              verification page
            </Link>{" "}
            — an admin will review it.
          </AlertDescription>
        </Alert>
      )}

      {/* Totals */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" /> Slots filled
          </p>
          <p className="mt-1 text-2xl font-bold">
            {totals.filled}
            <span className="text-base font-normal text-muted-foreground"> / {totals.needed}</span>
          </p>
          <Progress
            value={totals.needed > 0 ? Math.min(100, Math.round((totals.filled / totals.needed) * 100)) : 0}
            className="mt-2 h-2"
          />
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Send className="size-4" /> Pending applications
          </p>
          <p className={`mt-1 text-2xl font-bold ${totals.pending > 0 ? "text-amber-700" : ""}`}>
            {totals.pending}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Ban className="size-4" /> Tasks
          </p>
          <p className="mt-1 text-2xl font-bold">
            {event.tasks.filter((t) => t.status === "OPEN").length}
            <span className="text-base font-normal text-muted-foreground"> open / {event.tasks.length}</span>
          </p>
        </div>
      </div>

      {/* Pending approvals inbox */}
      {pendingApprovals.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">
            Applications waiting for you{" "}
            <span className="font-normal text-muted-foreground">({pendingApprovals.length})</span>
          </h2>
          <ul className="mt-4 space-y-3">
            {pendingApprovals.map((a) => (
              <li key={a.id} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {a.volunteer.name}{" "}
                      <span className="font-normal text-muted-foreground">
                        applied for “{a.taskTitle}”
                      </span>
                    </p>
                    {a.note && <p className="mt-0.5 text-sm text-muted-foreground">“{a.note}”</p>}
                  </div>
                  <ApprovalButtons assignmentId={a.id} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tasks & rosters */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Tasks &amp; rosters</h2>
        {event.tasks.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            This event has no tasks yet.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {event.tasks.map((task) => {
              const pct = Math.min(
                100,
                Math.round((task._count.assignments / Math.max(1, task.requiredVolunteers)) * 100),
              );
              return (
                <div key={task.id} className="rounded-lg border bg-card">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      {task.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{taskModeLabels[task.mode]}</Badge>
                      <div className="w-40">
                        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                          <span>
                            {task._count.assignments}/{task.requiredVolunteers}
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    </div>
                  </div>

                  {task.assignments.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">No sign-ups yet.</p>
                  ) : (
                    <ul className="divide-y">
                      {task.assignments.map((a) => (
                        <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{a.volunteer.name}</p>
                            <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                              {a.volunteer.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="size-3" /> {a.volunteer.phone}
                                </span>
                              )}
                              <span>{a.volunteer.email}</span>
                            </p>
                          </div>
                          {a.status === AssignmentStatus.PENDING ? (
                            <ApprovalButtons assignmentId={a.id} />
                          ) : (
                            <Badge className="bg-primary/10 text-primary border-transparent hover:bg-primary/10">
                              Confirmed
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

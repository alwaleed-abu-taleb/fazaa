import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ClipboardList, Plus, Users } from "lucide-react";
import { AssignmentStatus, EventStatus } from "@prisma/client";
import { getCurrentUser } from "@/server/auth";
import {
  getOrganizerEvents,
  getVolunteerActivities,
} from "@/features/dashboard/queries";
import { getUserVerificationStatus } from "@/features/verification/queries";
import { getPreferredCity } from "@/features/locations/queries";
import { db } from "@/server/db";
import { EventCard } from "@/features/events/components/EventCard";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck } from "lucide-react";
import { WelcomeBanner } from "@/features/dashboard/components/WelcomeBanner";
import { StatCard } from "@/features/dashboard/components/StatCard";
import { RoleProfile } from "@/features/dashboard/components/RoleProfile";

export const metadata: Metadata = { title: "لوحة التحكم" };

const dateFmt = new Intl.DateTimeFormat("ar", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const assignmentBadge: Record<AssignmentStatus, { label: string; className: string }> = {
  PENDING: { label: "قيد المراجعة", className: "bg-gray-light text-gray-dark" },
  CONFIRMED: { label: "مؤكد", className: "bg-gold text-gold-foreground" },
  CANCELLED: { label: "ملغي", className: "bg-gray-light text-gray-dark" },
  COMPLETED: { label: "مكتمل", className: "bg-growth/15 text-growth" },
  NO_SHOW: { label: "لم يحضر", className: "bg-gray-light text-gray-dark" },
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return user.role === "ORGANIZER" ? (
    <OrganizerView userId={user.id} name={user.name} />
  ) : (
    <VolunteerView userId={user.id} name={user.name} />
  );
}

async function OrganizerView({
  userId,
  name,
}: {
  userId: string;
  name: string | null | undefined;
}) {
  const [events, verification, profile] = await Promise.all([
    getOrganizerEvents(userId),
    getUserVerificationStatus(userId),
    db.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        organizerProfile: { select: { orgName: true, isVerified: true } },
      },
    }),
  ]);

  const live = events.filter(
    (e) => e.status === EventStatus.PUBLISHED || e.status === EventStatus.ONGOING,
  ).length;
  const confirmed = events.reduce((sum, e) => sum + e.slotsFilled, 0);
  const pending = events.reduce((sum, e) => sum + e.pendingCount, 0);

  return (
    <div className="space-y-8">
      <WelcomeBanner
        name={name}
        role="ORGANIZER"
        subtitle={`لديك ${live} حدث نشط و ${confirmed} متطوع مسجل`}
      />

      {!verification.isVerified && (
        <Alert>
          <ShieldCheck className="size-4" aria-hidden="true" />
          <AlertTitle>منظمتك لم تُوثَّق بعد</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>يجب توثيق المنظمة قبل نشر الأحداث.</span>
            <Button size="sm" variant="outline" asChild>
              <Link href="/verify">توثيق المنظمة</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={ClipboardList} label="أحداث نشطة" value={String(live)} />
        <StatCard icon={Users} label="متطوعون مسجلون" value={String(confirmed)} />
        <StatCard
          icon={CalendarDays}
          label="طلبات قيد الانتظار"
          value={String(pending)}
          highlight={pending > 0}
        />
      </div>

      {/* My events */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-h2 font-semibold tracking-tight">أحدثي</h2>
            <p className="mt-1 text-body text-muted-foreground">الأحداث التي أنشأتها</p>
          </div>
          <Button asChild size="sm">
            <Link href="/events/new">
              <Plus className="size-4" /> إنشاء حدث جديد
            </Link>
          </Button>
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => (
              <EventCard
                key={e.id}
                id={e.id}
                title={e.title}
                city={e.city}
                category={e.category}
                startsAt={e.startsAt}
                organizerName={profile?.organizerProfile?.orgName ?? name ?? "—"}
                organizerVerified={verification.isVerified}
                slotsFilled={e.slotsFilled}
                slotsNeeded={e.slotsNeeded}
                status={e.status}
                actions={
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/events/${e.id}`}>تعديل</Link>
                  </Button>
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-border p-12 text-center">
            <p className="text-body text-muted-foreground">لم تنشئ أي حدث بعد.</p>
            <Button className="mt-4" variant="outline" asChild>
              <Link href="/events/new">أنشئ أول حدث</Link>
            </Button>
          </div>
        )}
      </section>

      {/* Task management */}
      <section>
        <h2 className="mb-4 text-h2 font-semibold tracking-tight">إدارة المهام</h2>
        <TaskManagement userId={userId} />
      </section>

      {/* Organizer profile */}
      <section>
        <h2 className="mb-4 text-h2 font-semibold tracking-tight">بيانات المنظم</h2>
        <RoleProfile
          name={name}
          email={profile?.email ?? null}
          role="ORGANIZER"
          organization={profile?.organizerProfile?.orgName ?? null}
          isVerified={profile?.organizerProfile?.isVerified}
        />
      </section>
    </div>
  );
}

async function TaskManagement({ userId }: { userId: string }) {
  const events = await db.event.findMany({
    where: { organizerId: userId },
    select: {
      id: true,
      title: true,
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          assignments: {
            where: { status: { in: [AssignmentStatus.PENDING, AssignmentStatus.CONFIRMED] } },
            select: { id: true, status: true, volunteer: { select: { name: true } } },
          },
        },
      },
    },
  });

  const tasks = events.flatMap((e) =>
    e.tasks.map((t) => ({
      ...t,
      eventTitle: e.title,
      eventId: e.id,
    })),
  );

  if (tasks.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-border p-12 text-center">
        <p className="text-body text-muted-foreground">لا توجد مهام بعد.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {tasks.map((t) => {
        const assignment = t.assignments[0];
        const badge = assignment
          ? assignmentBadge[assignment.status]
          : null;
        return (
          <li
            key={t.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-card p-3 transition-colors hover:bg-gray-light"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-body font-semibold">{t.title}</h3>
                {badge && (
                  <span className={`rounded-full px-2 py-0.5 text-caption font-medium ${badge.className}`}>
                    {badge.label}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-caption text-muted-foreground">
                الحدث:{" "}
                <Link
                  href={`/events/${t.eventId}`}
                  className="font-medium text-dead-sea underline-offset-2 hover:underline"
                >
                  {t.eventTitle}
                </Link>
                {assignment ? ` · مسند إلى ${assignment.volunteer.name}` : " · غير مسند"}
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href={`/events/${t.eventId}`}>إدارة</Link>
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

async function VolunteerView({
  userId,
  name,
}: {
  userId: string;
  name: string | null | undefined;
}) {
  const [activities, preferred, profile] = await Promise.all([
    getVolunteerActivities(userId),
    getPreferredCity(userId),
    db.user.findUnique({
      where: { id: userId },
      select: { email: true, createdAt: true },
    }),
  ]);

  const upcoming = activities.upcoming;

  return (
    <div className="space-y-8">
      <WelcomeBanner
        name={name}
        role="VOLUNTEER"
        subtitle={
          profile?.createdAt
            ? `أنت متطوع مسجل منذ ${dateFmt.format(profile.createdAt)}`
            : "شكراً لانضمامك إلى مجتمع التطوع"
        }
      />

      {/* Upcoming events */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-h2 font-semibold tracking-tight">الأحداث القادمة</h2>
            <p className="mt-1 text-body text-muted-foreground">
              مهامك في الأحداث القادمة
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/events">تصفح الأحداث</Link>
          </Button>
        </div>

        {upcoming.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((a) => (
              <EventCard
                key={a.id}
                id={a.task.event.id}
                title={a.task.event.title}
                city={a.task.event.city}
                category={a.task.event.category}
                startsAt={a.task.event.startsAt}
                organizerName={a.task.event.organizer.name}
                slotsFilled={0}
                slotsNeeded={a.task.requiredVolunteers}
                status={a.task.event.status}
                actions={
                  <Button asChild size="sm">
                    <Link href={`/events/${a.task.event.id}`}>الانضمام</Link>
                  </Button>
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-border p-12 text-center">
            <p className="text-body text-muted-foreground">
              لا توجد أحداث قادمة بعد — هناك من يحتاج يد المساعدة.
            </p>
            <Button className="mt-4" variant="outline" asChild>
              <Link href="/events">تصفح الأحداث</Link>
            </Button>
          </div>
        )}
      </section>

      {/* My tasks */}
      <section>
        <h2 className="mb-4 text-h2 font-semibold tracking-tight">مهامي</h2>
        {upcoming.length > 0 || activities.past.length > 0 ? (
          <ul className="space-y-3">
            {[...upcoming, ...activities.past].map((a) => {
              const badge = assignmentBadge[a.status as AssignmentStatus];
              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-card p-3 transition-colors hover:bg-gray-light"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-body font-semibold">{a.task.title}</h3>
                      {badge && (
                        <span className={`rounded-full px-2 py-0.5 text-caption font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-caption text-muted-foreground">
                      <Link
                        href={`/events/${a.task.event.id}`}
                        className="font-medium text-dead-sea underline-offset-2 hover:underline"
                      >
                        {a.task.event.title}
                      </Link>
                      {" · "}
                      {formatDate(a.task.event.startsAt)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/events/${a.task.event.id}`}>عرض الحدث</Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="rounded-card border border-dashed border-border p-12 text-center">
            <p className="text-body text-muted-foreground">
              لا توجد مهام مسندة بعد. انضم إلى حدث لتبدأ.
            </p>
          </div>
        )}
      </section>

      {/* My profile */}
      <section>
        <h2 className="mb-4 text-h2 font-semibold tracking-tight">بياناتي</h2>
        <RoleProfile
          name={name}
          email={profile?.email ?? null}
          role="VOLUNTEER"
          city={preferred?.preferredCity?.name ?? null}
        />
      </section>
    </div>
  );
}

import { formatDateTime } from "@/lib/format";

/**
 * Pure formatting for the roster export — no DB access, safe to reuse in tests.
 * Attended/Hours are DERIVED: there are no attendance columns yet.
 *   Attended → Y for COMPLETED, N for NO_SHOW, — otherwise.
 *   Hours    → task window (falling back to the event window) for COMPLETED only.
 */
export const ROSTER_HEADERS = [
  "Name",
  "Email",
  "Phone",
  "Task",
  "Status",
  "Date Claimed",
  "Attended",
  "Hours Worked",
] as const;

export function getCSVHeaders(): string[] {
  return [...ROSTER_HEADERS];
}

export const rosterStatusLabel: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  NO_SHOW: "No-show",
};

export type RosterAssignment = {
  status: string;
  createdAt: Date;
  volunteer: { name: string; email: string; phone: string | null };
  task: { title: string; startsAt: Date | null; endsAt: Date | null };
};

export type RosterRow = {
  name: string;
  email: string;
  phone: string;
  task: string;
  status: string;
  claimedAt: string;
  attended: string;
  hours: string;
};

export function formatRosterData(
  assignments: RosterAssignment[],
  eventWindow: { startsAt: Date; endsAt: Date | null },
): RosterRow[] {
  return assignments.map((a) => {
    const start = a.task.startsAt ?? eventWindow.startsAt;
    const end = a.task.endsAt ?? eventWindow.endsAt ?? null;
    const hours =
      end && end.getTime() > start.getTime()
        ? (end.getTime() - start.getTime()) / 3600000
        : null;

    return {
      name: a.volunteer.name,
      email: a.volunteer.email,
      phone: a.volunteer.phone ?? "—",
      task: a.task.title,
      status: rosterStatusLabel[a.status] ?? a.status,
      claimedAt: formatDateTime(a.createdAt),
      attended: a.status === "COMPLETED" ? "Y" : a.status === "NO_SHOW" ? "N" : "—",
      hours:
        a.status === "COMPLETED" && hours !== null
          ? String(Number(hours.toFixed(1)))
          : "—",
    };
  });
}

export function rosterFileName(eventSlug: string, format: "csv" | "xlsx") {
  return `roster-${eventSlug}.${format}`;
}

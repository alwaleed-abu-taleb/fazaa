import { z } from "zod";

// NOTE: shared client/server — must not import anything from @prisma/client.
export const exportFormatValues = ["csv", "xlsx"] as const;
export type ExportFormat = (typeof exportFormatValues)[number];

export const rosterStatusFilterValues = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "NO_SHOW",
] as const;
export type RosterStatusFilter = (typeof rosterStatusFilterValues)[number];

export const rosterStatusFilterLabels: Record<RosterStatusFilter, string> = {
  ALL: "All statuses",
  PENDING: "Pending approval",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  NO_SHOW: "No-show",
};

export const exportRequestSchema = z.object({
  eventId: z.string().uuid("Invalid event."),
  format: z.enum(exportFormatValues),
  taskId: z.string().uuid("Invalid task.").optional(), // absent = all tasks
  status: z.enum(rosterStatusFilterValues).default("ALL"),
});

"use server";

import Papa from "papaparse";
import * as XLSX from "xlsx-js-style";
import { AssignmentStatus } from "@prisma/client";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import {
  exportRequestSchema,
  type ExportFormat,
  type RosterStatusFilter,
} from "@/features/export/schemas";
import {
  formatRosterData,
  getCSVHeaders,
  rosterFileName,
  type RosterAssignment,
} from "@/features/export/utils";

export type ExportResult =
  | {
      ok: true;
      fileName: string;
      mimeType: string;
      /** CSV text, or base64 for xlsx (isBase64: true). */
      content: string;
      isBase64: boolean;
      headers: string[];
      rows: string[][];
      count: number;
    }
  | { ok: false; error: string };

/**
 * Builds the volunteer roster for one event in the requested format.
 * Only the event's organizer may export it.
 */
export async function exportRosterAction(
  eventId: string,
  format: ExportFormat,
  filters?: { taskId?: string; status?: RosterStatusFilter },
): Promise<ExportResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Please sign in first." };
    if (user.role !== "ORGANIZER") {
      return { ok: false, error: "Only organizers can export rosters." };
    }

    const parsed = exportRequestSchema.safeParse({
      eventId,
      format,
      taskId: filters?.taskId || undefined,
      status: filters?.status ?? "ALL",
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid export request." };
    }
    const { eventId: id, format: fmt, taskId, status } = parsed.data;

    const event = await db.event.findFirst({
      where: { id, organizerId: user.id },
      select: { slug: true, startsAt: true, endsAt: true },
    });
    if (!event) return { ok: false, error: "Event not found." };

    const assignments = await db.taskAssignment.findMany({
      where: {
        task: { eventId: id },
        ...(taskId ? { taskId } : {}),
        ...(status !== "ALL" ? { status: status as AssignmentStatus } : {}),
      },
      orderBy: [{ task: { createdAt: "asc" } }, { createdAt: "asc" }],
      select: {
        status: true,
        createdAt: true,
        volunteer: { select: { name: true, email: true, phone: true } },
        task: { select: { title: true, startsAt: true, endsAt: true } },
      },
    });

    if (assignments.length === 0) {
      return {
        ok: false,
        error: "No volunteers match this export yet — adjust the filters or check back later.",
      };
    }

    const rows = formatRosterData(
      assignments as RosterAssignment[],
      { startsAt: event.startsAt, endsAt: event.endsAt },
    );
    const matrix = rows.map((r) => [
      r.name,
      r.email,
      r.phone,
      r.task,
      r.status,
      r.claimedAt,
      r.attended,
      r.hours,
    ]);

    if (fmt === "csv") {
      // Papa.unparse handles quoting/escaping of commas, quotes and newlines.
      const csv = Papa.unparse({ fields: getCSVHeaders(), data: matrix });
      return {
        ok: true,
        fileName: rosterFileName(event.slug, "csv"),
        mimeType: "text/csv;charset=utf-8",
        content: csv,
        isBase64: false,
        headers: getCSVHeaders(),
        rows: matrix,
        count: rows.length,
      };
    }

    // Excel: bold header row + column widths + autofilter (print-friendly)
    const ws = XLSX.utils.aoa_to_sheet([getCSVHeaders(), ...matrix]);
    ws["!cols"] = [{ wch: 24 }, { wch: 30 }, { wch: 18 }, { wch: 28 }, { wch: 12 }, { wch: 22 }, { wch: 10 }, { wch: 14 }];
    ws["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: matrix.length, c: getCSVHeaders().length - 1 },
      }),
    };
    ws["!margins"] = { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 };
    for (let c = 0; c < getCSVHeaders().length; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
      if (cell) {
        cell.s = {
          font: { bold: true, sz: 11, color: { rgb: "0F172A" } },
          fill: { fgColor: { rgb: "D1FAE5" } },
          alignment: { horizontal: "left", vertical: "center" },
        };
      }
    }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Volunteer roster");
    const content = XLSX.write(wb, { bookType: "xlsx", type: "base64" });

    return {
      ok: true,
      fileName: rosterFileName(event.slug, "xlsx"),
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      content,
      isBase64: true,
      headers: getCSVHeaders(),
      rows: matrix,
      count: rows.length,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "The export failed — please try again.",
    };
  }
}

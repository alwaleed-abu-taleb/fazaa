"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  exportRosterAction,
  type ExportResult,
} from "@/features/export/actions";
import {
  exportFormatValues,
  rosterStatusFilterLabels,
  rosterStatusFilterValues,
  type ExportFormat,
  type RosterStatusFilter,
} from "@/features/export/schemas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const formatMeta: Record<ExportFormat, { label: string; hint: string; icon: typeof FileText }> = {
  csv: { label: "CSV", hint: "Universal — opens anywhere", icon: FileText },
  xlsx: { label: "Excel", hint: "Bold headers, ready to print", icon: FileSpreadsheet },
};

function triggerDownload(res: Extract<ExportResult, { ok: true }>) {
  const bytes = res.isBase64
    ? Uint8Array.from(atob(res.content), (c) => c.charCodeAt(0))
    : // BOM prefix so Excel opens UTF-8 CSV with special characters intact
      new TextEncoder().encode("\uFEFF" + res.content);
  const blob = new Blob([bytes], { type: res.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = res.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ExportDialog({
  eventId,
  tasks,
  open,
  onOpenChange,
}: {
  eventId: string;
  tasks: { id: string; title: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [taskId, setTaskId] = useState("ALL");
  const [status, setStatus] = useState<RosterStatusFilter>("ALL");
  const [preview, setPreview] = useState<Extract<ExportResult, { ok: true }> | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloading, startTransition] = useTransition();

  // Live preview of the first rows for the current filters
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPreviewLoading(true);
    exportRosterAction(eventId, "csv", {
      taskId: taskId === "ALL" ? undefined : taskId,
      status,
    }).then((res) => {
      if (cancelled) return;
      if (res.ok) {
        setPreview(res);
        setPreviewError(null);
      } else {
        setPreview(null);
        setPreviewError(res.error);
      }
      setPreviewLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, eventId, taskId, status]);

  function download() {
    startTransition(async () => {
      const res = await exportRosterAction(eventId, format, {
        taskId: taskId === "ALL" ? undefined : taskId,
        status,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      triggerDownload(res);
      toast.success(
        `Roster exported — ${res.count} volunteer${res.count === 1 ? "" : "s"} (${format.toUpperCase()})`,
      );
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Export volunteer roster</DialogTitle>
          <DialogDescription>
            Download the sign-up list for printing or sharing with your team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Format */}
          <div className="space-y-1.5">
            <Label>Format</Label>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Export format">
              {exportFormatValues.map((f) => {
                const meta = formatMeta[f];
                const Icon = meta.icon;
                const selected = format === f;
                return (
                  <button
                    key={f}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setFormat(f)}
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                      selected
                        ? "border-primary bg-accent ring-1 ring-primary"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <Icon className={cn("mt-0.5 size-4", selected ? "text-primary" : "text-muted-foreground")} />
                    <span>
                      <span className="block text-sm font-medium">{meta.label}</span>
                      <span className="block text-xs text-muted-foreground">{meta.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Task</Label>
              <Select value={taskId} onValueChange={setTaskId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All tasks</SelectItem>
                  {tasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v: RosterStatusFilter) => setStatus(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rosterStatusFilterValues.map((s) => (
                    <SelectItem key={s} value={s}>
                      {rosterStatusFilterLabels[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-1.5">
            <Label>Preview</Label>
            {previewLoading ? (
              <div className="flex h-28 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" /> Building preview…
              </div>
            ) : previewError ? (
              <Alert>
                <AlertDescription>{previewError}</AlertDescription>
              </Alert>
            ) : preview ? (
              <div className="overflow-hidden rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/60">
                      <tr>
                        {preview.headers.map((h) => (
                          <th key={h} className="whitespace-nowrap px-2.5 py-2 font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t">
                          {row.map((cell, j) => (
                            <td key={j} className="max-w-36 truncate whitespace-nowrap px-2.5 py-1.5 text-muted-foreground">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.count > 5 && (
                  <p className="border-t bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground">
                    + {preview.count - 5} more row{preview.count - 5 === 1 ? "" : "s"} in the file
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={downloading}>
            Cancel
          </Button>
          <Button onClick={download} disabled={downloading || previewLoading || !!previewError}>
            {downloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            {downloading ? "Generating…" : "Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

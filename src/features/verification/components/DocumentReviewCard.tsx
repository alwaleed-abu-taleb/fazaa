"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  approveDocumentAction,
  rejectDocumentAction,
  type ReviewResult,
} from "@/features/verification/actions";
import { documentTypeLabels } from "@/features/verification/schemas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatBytes, formatDateTime } from "@/lib/format";

export type PendingDocument = {
  id: string;
  documentType: "NGO_LICENSE" | "OFFICIAL_ID";
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  createdAt: Date;
  organizer: {
    id: string;
    name: string;
    email: string;
    organizerProfile: { orgName: string; isVerified: boolean } | null;
  };
};

export function DocumentReviewCard({ doc }: { doc: PendingDocument }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const isImage = doc.mimeType.startsWith("image/");

  function finish(result: ReviewResult) {
    if (result.ok) {
      toast.success(result.message ?? "Done.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  function approve() {
    startTransition(async () => finish(await approveDocumentAction(doc.id)));
  }

  function reject() {
    startTransition(async () => finish(await rejectDocumentAction(doc.id, reason)));
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b p-4">
        <div className="min-w-0">
          <p className="font-medium">
            {doc.organizer.organizerProfile?.orgName ?? doc.organizer.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {doc.organizer.name} · {doc.organizer.email}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {documentTypeLabels[doc.documentType]}
        </Badge>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-[auto_1fr]">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doc.fileUrl}
            alt={`${documentTypeLabels[doc.documentType]} upload from ${doc.organizer.name}`}
            className="h-40 w-full rounded-md border object-cover sm:w-64"
          />
        ) : (
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-40 w-full items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground hover:bg-muted/50 sm:w-64"
          >
            <FileText className="size-5" /> Open PDF
          </a>
        )}

        <div className="min-w-0 space-y-3">
          <div>
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-sm font-medium hover:text-primary hover:underline"
            >
              {doc.fileName}
            </a>
            <p className="text-xs text-muted-foreground">
              {formatBytes(doc.fileSize)} · uploaded {formatDateTime(doc.createdAt)}
            </p>
          </div>

          {rejecting ? (
            <div className="space-y-2">
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell the organizer what to fix — e.g. the license photo is cropped and the expiry date isn't visible."
                rows={3}
                maxLength={500}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="destructive" disabled={pending || reason.trim().length < 5} onClick={reject}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                  Confirm rejection
                </Button>
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => setRejecting(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={pending} onClick={approve}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Approve &amp; verify
              </Button>
              <Button size="sm" variant="outline" className="text-destructive" disabled={pending} onClick={() => setRejecting(true)}>
                <X className="size-4" /> Reject
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

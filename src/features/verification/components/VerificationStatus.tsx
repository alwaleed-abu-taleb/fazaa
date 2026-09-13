import { CheckCircle2, Clock, FileText, ImageIcon, XCircle } from "lucide-react";
import type { VerificationStatusView } from "@/features/verification/queries";
import { documentTypeLabels } from "@/features/verification/schemas";
import { VerificationBadge } from "@/features/verification/components/VerificationBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { formatBytes, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusBadge: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent",
  APPROVED: "bg-primary/10 text-primary border-transparent",
  REJECTED: "bg-destructive/10 text-destructive border-transparent",
};

export function VerificationStatus({ status }: { status: VerificationStatusView }) {
  const latestRejection = status.documents.find((d) => d.status === "REJECTED");

  return (
    <div className="space-y-4">
      {status.isVerified && (
        <Alert className="border-primary/30 bg-primary/5">
          <CheckCircle2 className="size-4 text-primary" />
          <AlertTitle className="flex items-center gap-1.5">
            Organization verified <VerificationBadge verified />
          </AlertTitle>
          <AlertDescription>
            Your badge is live on your profile and events. You can publish events.
          </AlertDescription>
        </Alert>
      )}

      {!status.isVerified && status.hasPending && (
        <Alert className="border-amber-500/40 bg-amber-500/5">
          <Clock className="size-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle>Review in progress</AlertTitle>
          <AlertDescription>
            An admin is reviewing your document. You&rsquo;ll see the result here — publishing is
            unlocked once you&rsquo;re verified.
          </AlertDescription>
        </Alert>
      )}

      {!status.isVerified && !status.hasPending && latestRejection && (
        <Alert variant="destructive">
          <XCircle className="size-4" />
          <AlertTitle>Document rejected</AlertTitle>
          <AlertDescription>
            {latestRejection.rejectionReason ?? "Please reupload a clearer document."}
          </AlertDescription>
        </Alert>
      )}

      {status.documents.length > 0 && (
        <ul className="divide-y rounded-lg border bg-card">
          {status.documents.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                {doc.mimeType === "application/pdf" ? (
                  <FileText className="size-5 shrink-0 text-muted-foreground" />
                ) : (
                  <ImageIcon className="size-5 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm font-medium hover:text-primary hover:underline"
                  >
                    {doc.fileName}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {documentTypeLabels[doc.documentType]} · {formatBytes(doc.fileSize)} ·{" "}
                    {formatDate(doc.createdAt)}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={cn("shrink-0 font-medium", statusBadge[doc.status])}>
                {doc.status.charAt(0) + doc.status.slice(1).toLowerCase()}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

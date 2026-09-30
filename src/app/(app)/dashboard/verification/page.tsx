import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { getPendingDocuments } from "@/features/verification/queries";
import { DocumentReviewCard } from "@/features/verification/components/DocumentReviewCard";

export const metadata: Metadata = { title: "Verification review" };

export default async function VerificationAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const pending = await getPendingDocuments();

  return (
    <div className="max-w-[56rem]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Verification review</h1>
        <p className="mt-1 text-muted-foreground">
          {pending.length > 0
            ? `${pending.length} document${pending.length === 1 ? "" : "s"} waiting for review — oldest first.`
            : "The review queue is empty."}
        </p>
      </div>

      {pending.length > 0 ? (
        <div className="space-y-4">
          {pending.map((doc) => (
            <DocumentReviewCard key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <ClipboardCheck className="size-8 text-muted-foreground" />
          <p className="text-muted-foreground">
            No pending documents. New uploads from organizers will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

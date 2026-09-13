import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/server/auth";
import { getUserVerificationStatus } from "@/features/verification/queries";
import { VerificationStatus } from "@/features/verification/components/VerificationStatus";
import { DocumentUploadForm } from "@/features/verification/components/DocumentUploadForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Verify your organization" };

export default async function VerifyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER") redirect("/dashboard");

  const status = await getUserVerificationStatus(user.id);
  const canUpload = !status.isVerified && !status.hasPending;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Verify your organization</h1>
        <p className="mt-1 text-muted-foreground">
          Verified organizers get a badge on their profile and events — and can publish events.
        </p>
      </div>

      <Alert className="mb-6">
        <ShieldCheck className="size-4" />
        <AlertTitle>Verify your organization to publish events</AlertTitle>
        <AlertDescription>
          Upload your NGO license or an official ID (JPEG, PNG or PDF, up to 10 MB). An admin
          reviews it and your verification badge appears automatically once approved.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <VerificationStatus status={status} />
        {canUpload && <DocumentUploadForm />}
        {status.hasPending && (
          <p className="text-sm text-muted-foreground">
            You already have a document under review — check back here for the result.
          </p>
        )}
      </div>
    </div>
  );
}

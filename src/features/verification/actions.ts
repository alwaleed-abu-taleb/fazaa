"use server";

import { revalidatePath } from "next/cache";
import { VerificationStatus } from "@prisma/client";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import {
  documentTypeLabels,
  rejectDocumentSchema,
  uploadDocumentSchema,
} from "@/features/verification/schemas";
import { uploadVerificationFile } from "@/features/verification/upload";
import { getUserVerificationStatus } from "@/features/verification/queries";
import { fail } from "@/server/errors";

export type VerificationFormState = { error?: string; message?: string };

function revalidateVerificationPaths() {
  revalidatePath("/verify");
  revalidatePath("/dashboard/verification");
  revalidatePath("/profile");
  revalidatePath("/events");
  revalidatePath("/dashboard");
}

export async function uploadDocumentAction(
  _prev: VerificationFormState,
  formData: FormData,
): Promise<VerificationFormState> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in first.");
  if (user.role !== "ORGANIZER") {
    return fail("Only organizer accounts can upload verification documents.");
  }

  const parsed = uploadDocumentSchema.safeParse({
    documentType: formData.get("documentType"),
    file: formData.get("file"),
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  }
  const { documentType, file } = parsed.data;

  const profile = await db.organizerProfile.findUnique({
    where: { userId: user.id },
    select: { isVerified: true },
  });
  if (profile?.isVerified) {
    return fail("Your organization is already verified.");
  }

  const existing = await db.verificationDocument.findFirst({
    where: {
      organizerId: user.id,
      documentType,
      status: VerificationStatus.PENDING,
    },
    select: { id: true },
  });
  if (existing) {
    return fail(
      `You already have a pending review for your ${documentTypeLabels[documentType].toLowerCase()}.`,
    );
  }

  let stored: { url: string; key: string | null };
  try {
    stored = await uploadVerificationFile(file);
  } catch (err) {
    return fail(err instanceof Error ? err.message : "The upload failed — please try again.");
  }

  await db.verificationDocument.create({
    data: {
      organizerId: user.id,
      documentType,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      fileUrl: stored.url,
      fileKey: stored.key,
      status: VerificationStatus.PENDING,
    },
  });

  revalidateVerificationPaths();
  return { message: "Document uploaded — an admin will review it shortly." };
}

export type ReviewResult = { ok: true; message?: string } | { ok: false; error: string };

export async function approveDocumentAction(docId: string): Promise<ReviewResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { ok: false, error: "Only admins can review verification documents." };
  }

  const doc = await db.verificationDocument.findUnique({
    where: { id: docId },
    select: { status: true, organizerId: true },
  });
  if (!doc) return { ok: false, error: "Document not found." };
  if (doc.status !== VerificationStatus.PENDING) {
    return { ok: false, error: "This document was already reviewed." };
  }

  await db.$transaction([
    db.verificationDocument.update({
      where: { id: docId },
      data: { status: VerificationStatus.APPROVED, reviewedAt: new Date(), reviewedBy: user.id },
    }),
    // Verified status lives on the profile — documents are the audit trail.
    db.organizerProfile.updateMany({
      where: { userId: doc.organizerId },
      data: { isVerified: true },
    }),
  ]);

  revalidateVerificationPaths();
  return { ok: true, message: "Organizer verified." };
}

export async function rejectDocumentAction(docId: string, reason: string): Promise<ReviewResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { ok: false, error: "Only admins can review verification documents." };
  }

  const parsed = rejectDocumentSchema.safeParse({ reason });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a rejection reason." };
  }

  const doc = await db.verificationDocument.findUnique({
    where: { id: docId },
    select: { status: true, organizerId: true },
  });
  if (!doc) return { ok: false, error: "Document not found." };
  if (doc.status !== VerificationStatus.PENDING) {
    return { ok: false, error: "This document was already reviewed." };
  }

  await db.$transaction(async (tx) => {
    await tx.verificationDocument.update({
      where: { id: docId },
      data: {
        status: VerificationStatus.REJECTED,
        rejectionReason: parsed.data.reason,
        reviewedAt: new Date(),
        reviewedBy: user.id,
      },
    });
    // Rejection only un-verifies if no other approved document backs the profile.
    const approvedCount = await tx.verificationDocument.count({
      where: { organizerId: doc.organizerId, status: VerificationStatus.APPROVED },
    });
    if (approvedCount === 0) {
      await tx.organizerProfile.updateMany({
        where: { userId: doc.organizerId },
        data: { isVerified: false },
      });
    }
  });

  revalidateVerificationPaths();
  return { ok: true, message: "Document rejected." };
}

export async function getVerificationStatusAction() {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in first.");
  const status = await getUserVerificationStatus(user.id);
  return { ok: true as const, status };
}

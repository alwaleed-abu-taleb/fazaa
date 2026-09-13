import { VerificationStatus } from "@prisma/client";
import { db } from "@/server/db";

export type VerificationDocumentView = {
  id: string;
  documentType: "NGO_LICENSE" | "OFFICIAL_ID";
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
};

export type VerificationStatusView = {
  isVerified: boolean;
  hasPending: boolean;
  documents: VerificationDocumentView[];
};

export async function getUserVerificationStatus(userId: string): Promise<VerificationStatusView> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      organizerProfile: { select: { isVerified: true } },
      verificationDocuments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          documentType: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          fileUrl: true,
          status: true,
          rejectionReason: true,
          reviewedAt: true,
          createdAt: true,
        },
      },
    },
  });

  return {
    isVerified: user?.organizerProfile?.isVerified ?? false,
    hasPending: user?.verificationDocuments.some((d) => d.status === VerificationStatus.PENDING) ?? false,
    documents: (user?.verificationDocuments ?? []) as VerificationDocumentView[],
  };
}

export async function getPendingDocuments() {
  return db.verificationDocument.findMany({
    where: { status: VerificationStatus.PENDING },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      documentType: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      fileUrl: true,
      createdAt: true,
      organizer: {
        select: {
          id: true,
          name: true,
          email: true,
          organizerProfile: { select: { orgName: true, isVerified: true } },
        },
      },
    },
  });
}

export async function countPendingDocuments() {
  return db.verificationDocument.count({ where: { status: VerificationStatus.PENDING } });
}

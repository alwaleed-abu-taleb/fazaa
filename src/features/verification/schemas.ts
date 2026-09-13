import { z } from "zod";

// NOTE: shared client/server — must not import anything from @prisma/client.
export const verificationDocumentTypeValues = ["NGO_LICENSE", "OFFICIAL_ID"] as const;
export type VerificationDocumentType = (typeof verificationDocumentTypeValues)[number];

export const verificationStatusValues = ["PENDING", "APPROVED", "REJECTED"] as const;
export type VerificationStatus = (typeof verificationStatusValues)[number];

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const documentTypeLabels: Record<VerificationDocumentType, string> = {
  NGO_LICENSE: "NGO license",
  OFFICIAL_ID: "Official ID",
};

export const uploadDocumentSchema = z.object({
  documentType: z.enum(verificationDocumentTypeValues),
  file: z
    .instanceof(File, { message: "Choose a file to upload" })
    .refine((f) => f.size > 0, "The selected file is empty")
    .refine(
      (f) => (ALLOWED_MIME_TYPES as readonly string[]).includes(f.type),
      "Only JPEG, PNG and PDF files are allowed",
    )
    .refine(
      (f) => f.size <= MAX_DOCUMENT_SIZE_BYTES,
      "Files must be 10 MB or smaller",
    ),
});

export const rejectDocumentSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Tell the organizer what to fix (at least 5 characters)")
    .max(500),
});

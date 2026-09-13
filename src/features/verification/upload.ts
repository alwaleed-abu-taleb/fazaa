import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export type StoredFile = {
  /** Public URL — UploadThing CDN in production, /api/files/<key> in local dev. */
  url: string;
  /** UploadThing file key, or the local storage key. */
  key: string | null;
};

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".uploads");

/**
 * Uploads a verified document. Production path is UploadThing (requires
 * UPLOADTHING_TOKEN in .env); without a token we fall back to local disk via
 * /api/files/<key> so the feature works end-to-end in local development.
 */
export async function uploadVerificationFile(file: File): Promise<StoredFile> {
  if (process.env.UPLOADTHING_TOKEN) {
    const { UTApi } = await import("uploadthing/server");
    const utapi = new UTApi();
    const res = await utapi.uploadFiles(file);
    if (!res.data) {
      throw new Error(res.error?.message ?? "The upload failed — please try again.");
    }
    return {
      url: res.data.ufsUrl ?? (res.data as { url?: string }).url ?? "",
      key: res.data.key,
    };
  }

  // Local dev fallback
  const ext = extensionFor(file.name, file.type);
  const key = `${crypto.randomUUID()}${ext}`;
  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_UPLOAD_DIR, key), Buffer.from(await file.arrayBuffer()));
  return { url: `/api/files/${key}`, key };
}

function extensionFor(fileName: string, mimeType: string) {
  const fromName = path.extname(fileName).toLowerCase();
  if (fromName) return fromName;
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "application/pdf":
      return ".pdf";
    default:
      return "";
  }
}

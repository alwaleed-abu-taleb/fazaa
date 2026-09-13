import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

// Serves documents stored by the local dev fallback in features/verification/upload.ts.
// In production (UPLOADTHING_TOKEN set) files stream from UploadThing's CDN instead.
// Access is restricted to the owning organizer and admins — these are ID documents.
const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  // Key is a UUID + known extension — anything else never hits the disk.
  if (!/^[0-9a-fA-F-]{36}\.(jpe?g|png|pdf)$/.test(key)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const doc = await db.verificationDocument.findFirst({
    where: { fileKey: key },
    select: { organizerId: true },
  });
  if (!doc) return new NextResponse("Not found", { status: 404 });

  const role = session.user.role;
  if (session.user.id !== doc.organizerId && role !== "ADMIN") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const buffer = await readFile(path.join(process.cwd(), ".uploads", key));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": MIME[path.extname(key).toLowerCase()] ?? "application/octet-stream",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

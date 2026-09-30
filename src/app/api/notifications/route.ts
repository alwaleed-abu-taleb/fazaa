import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

const markReadSchema = z.object({ id: z.string() });
const markAllReadSchema = z.object({ markAllRead: z.literal(true) });

/**
 * In-app notifications for the signed-in user. Newest first, capped at the
 * last 20 — the client paginates/refreshes rather than holding a full history.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const notifications = await db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        read: true,
        createdAt: true,
      },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("[api/notifications] GET error:", error);
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}

/**
 * Marks notifications as read. Two modes, both ownership-guarded by userId:
 *  - { markAllRead: true } flips every unread notification of the caller and
 *    reports how many changed ({ updated }). Takes precedence over { id }.
 *  - { id } flips one; a wrong or foreign id matches nothing (404).
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);

    // Bulk mode: mark every unread notification of the caller as read. Only
    // unread rows are touched, so `updated` reflects real changes.
    const markAll = markAllReadSchema.safeParse(body);
    if (markAll.success) {
      const result = await db.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true },
      });
      return NextResponse.json({ updated: result.count });
    }

    // Single mode.
    const parsed = markReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
    }

    const result = await db.notification.updateMany({
      where: { id: parsed.data.id, userId: session.user.id },
      data: { read: true },
    });
    if (result.count === 0) {
      return NextResponse.json({ error: "الإشعار غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/notifications] PATCH error:", error);
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}

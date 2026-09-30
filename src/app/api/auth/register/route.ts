import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

// Lean public contract — the shared registerSchema in features/auth/schemas.ts
// also collects cityId/districtId/terms for the in-app form; this REST endpoint
// intentionally carries only the auth-critical fields.
const registerPayloadSchema = z
  .object({
    name: z.string().trim().min(2, "الاسم يجب أن يحتوي على حرفين على الأقل"),
    email: z.string().trim().toLowerCase().email("أدخل بريداً إلكترونياً صحيحاً"),
    password: z.string().min(8, "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل"),
    role: z.enum(["VOLUNTEER", "ORGANIZER"]),
    orgName: z.string().trim().min(2, "اسم المنظمة يجب أن يحتوي على حرفين على الأقل").optional(),
  })
  .refine((data) => data.role !== "ORGANIZER" || !!data.orgName, {
    message: "اسم المنظمة مطلوب لحسابات المنظمين",
    path: ["orgName"],
  });

/**
 * Public registration endpoint. Creates a user and, for organizers, the
 * accompanying organizerProfile. Stateless: it does not establish a session —
 * the caller signs in separately.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = registerPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "تحقق من بياناتك" },
        { status: 400 },
      );
    }

    const { name, email, password, role, orgName } = parsed.data;

    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مسجل مسبقاً" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role,
        ...(role === "ORGANIZER" && orgName
          ? { organizerProfile: { create: { orgName } } }
          : {}),
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[api/auth/register] unexpected error:", error);
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}

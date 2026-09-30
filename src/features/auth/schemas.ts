import { z } from "zod";

// NOTE: shared client/server — must not import anything from @prisma/client.
export const roleValues = ["VOLUNTEER", "ORGANIZER"] as const;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "الاسم يجب أن يحتوي على حرفين على الأقل").max(80),
    email: z.string().trim().toLowerCase().email("أدخل بريداً إلكترونياً صحيحاً"),
    phone: z.string().trim().min(1).max(30).optional(),
    role: z.enum(roleValues),
    orgName: z.string().trim().min(2, "اسم المنظمة يجب أن يحتوي على حرفين على الأقل").max(120).optional(),
    password: z.string().min(8, "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل").max(72),
    confirmPassword: z.string(),
    cityId: z.string().uuid("اختر المحافظة"),
    districtId: z.string().uuid("اختر الناحية"),
    terms: z.literal(true, { message: "يجب الموافقة على الشروط والأحكام" }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  })
  .refine((d) => d.role !== "ORGANIZER" || !!d.orgName, {
    message: "اسم المنظمة مطلوب لحسابات المنظمين",
    path: ["orgName"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("أدخل بريداً إلكترونياً صحيحاً"),
  password: z.string().min(1, "أدخل كلمة المرور"),
  remember: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("أدخل بريداً إلكترونياً صحيحاً"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/** Field-keyed errors for inline display next to each input. */
export type FieldErrors = Partial<Record<string, string[]>>;

"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { signIn, signOut } from "@/server/auth";
import {
  forgotPasswordSchema,
  registerSchema,
  loginSchema,
  type FieldErrors,
} from "@/features/auth/schemas";
import { fail } from "@/server/errors";

export type AuthFormState = {
  error?: string;
  fieldErrors?: FieldErrors;
  /** Set when a form-level success banner should show (e.g. forgot-password). */
  success?: string;
};

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    role: formData.get("role"),
    orgName: formData.get("orgName") || undefined,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    cityId: formData.get("cityId") || undefined,
    districtId: formData.get("districtId") || undefined,
    terms: formData.get("terms") === "true",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as FieldErrors,
      error: parsed.error.issues[0]?.message ?? "Please check your details.",
    };
  }

  const { name, email, phone, role, orgName, password, cityId, districtId } =
    parsed.data;

  // District must belong to the chosen city — enforced server-side because the
  // client cascade is easy to bypass.
  const city = await db.city.findUnique({
    where: { id: cityId },
    select: { id: true },
  });
  if (!city) {
    return fail("Selected governorate does not exist.");
  }
  const district = await db.district.findUnique({
    where: { id: districtId },
    select: { id: true, cityId: true },
  });
  if (!district || district.cityId !== cityId) {
    return {
      fieldErrors: {
        districtId: ["This district does not belong to the selected governorate."],
      },
    };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return {
      fieldErrors: {
        email: ["An account with this email already exists — try signing in instead."],
      },
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    await db.user.create({
      data: {
        name,
        email,
        phone: phone ?? null,
        passwordHash,
        role,
        preferredCityId: cityId,
        ...(role === "ORGANIZER" && orgName
          ? { organizerProfile: { create: { orgName } } }
          : {}),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        fieldErrors: {
          email: ["An account with this email already exists — try signing in instead."],
        },
      };
    }
    throw err;
  }

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  return {}; // unreachable — signIn always redirects on success
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    remember: formData.get("remember") === "true",
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as FieldErrors,
      error: parsed.error.issues[0]?.message ?? "Enter your email and password.",
    };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/dashboard" });
  } catch (err) {
    if (err instanceof AuthError) {
      return fail("Invalid email or password.");
    }
    throw err; // includes the NEXT_REDIRECT that signIn throws on success
  }
  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

/**
 * Password-reset request — STUB.
 * Email transport isn't configured yet, so this only validates the address and
 * returns a generic success. Real delivery is wired up in a later phase; for now
 * the form's job is validation + UX. Runs a best-effort lookup so the response
 * never reveals whether an account exists.
 */
export async function forgotPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors as FieldErrors,
      error: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
    };
  }

  await db.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  return {
    success:
      "If an account exists for this email, a reset link is on its way. Check your inbox.",
  };
}

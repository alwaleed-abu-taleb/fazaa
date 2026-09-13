"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { signIn, signOut } from "@/server/auth";
import { registerSchema, loginSchema } from "@/features/auth/schemas";
import { fail } from "@/server/errors";

export type AuthFormState = { error?: string };

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
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check your details.");
  }

  const { name, email, phone, role, orgName, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return fail("An account with this email already exists — try signing in instead.");
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
        ...(role === "ORGANIZER" && orgName
          ? { organizerProfile: { create: { orgName } } }
          : {}),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return fail("An account with this email already exists — try signing in instead.");
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
  });
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Enter your email and password.");
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

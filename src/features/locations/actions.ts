"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";

const preferredCitySchema = z.object({
  cityId: z.string().uuid().nullable(), // null clears the preference
});

export type PreferredCityResult =
  | { ok: true }
  | { ok: false; error: string };

/** Saves (or clears) the signed-in user's preferred Jordan city. */
export async function setPreferredCityAction(
  cityId: string | null,
): Promise<PreferredCityResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in first." };

  const parsed = preferredCitySchema.safeParse({ cityId });
  if (!parsed.success) return { ok: false, error: "Invalid city." };

  if (parsed.data.cityId) {
    const city = await db.city.findUnique({
      where: { id: parsed.data.cityId },
      select: { id: true },
    });
    if (!city) return { ok: false, error: "City not found." };
  }

  await db.user.update({
    where: { id: user.id },
    data: { preferredCityId: parsed.data.cityId },
  });

  revalidatePath("/events");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}

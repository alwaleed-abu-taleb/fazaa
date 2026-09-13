import { z } from "zod";

// NOTE: shared client/server — must not import anything from @prisma/client.
export const roleValues = ["VOLUNTEER", "ORGANIZER"] as const;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    phone: z.string().trim().min(1).max(30).optional(),
    role: z.enum(roleValues),
    orgName: z.string().trim().min(2, "Organization name must be at least 2 characters").max(120).optional(),
    password: z.string().min(8, "Password must be at least 8 characters").max(72),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.role !== "ORGANIZER" || !!d.orgName, {
    message: "Organization name is required for organizer accounts",
    path: ["orgName"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

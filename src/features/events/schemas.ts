import { z } from "zod";

// NOTE: shared client/server — must not import anything from @prisma/client.
export const eventCategoryValues = ["SPORTS", "MARATHON", "CLEANUP", "COMMUNITY", "OTHER"] as const;
export const taskModeValues = ["INSTANT_CLAIM", "APPROVAL"] as const;

export const taskFormSchema = z.object({
  title: z.string().trim().min(2, "Each task needs a title").max(120),
  description: z.string().trim().max(500).optional(),
  requiredVolunteers: z.coerce
    .number({ message: "Volunteers needed must be a number" })
    .int("Whole numbers only")
    .min(1, "At least 1 volunteer per task")
    .max(500, "Max 500 volunteers per task"),
  mode: z.enum(taskModeValues),
});

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(140),
    description: z
      .string()
      .trim()
      .min(20, "Describe the event in at least 20 characters")
      .max(4000),
    category: z.enum(eventCategoryValues),
    cityId: z.string().uuid("Choose a city"),
    districtId: z.string().uuid("Choose a valid district").optional(),
    location: z.string().trim().min(2, "Meeting point is required").max(200),
    startsAt: z.coerce.date({ message: "Start date/time is required" }),
    endsAt: z.coerce.date().optional(),
    coverImageUrl: z.string().trim().url("Cover image must be a valid URL").max(500).optional(),
    tasks: z.array(taskFormSchema).min(1, "Add at least one task").max(20, "Max 20 tasks per event"),
  })
  .refine((d) => !d.endsAt || d.endsAt > d.startsAt, {
    message: "End time must be after the start time",
    path: ["endsAt"],
  });

export type EventFormInput = z.infer<typeof eventFormSchema>;
export type TaskFormInput = z.infer<typeof taskFormSchema>;

export const categoryLabels: Record<(typeof eventCategoryValues)[number], string> = {
  SPORTS: "Sports",
  MARATHON: "Marathon",
  CLEANUP: "Cleanup",
  COMMUNITY: "Community",
  OTHER: "Other",
};

export const taskModeLabels: Record<(typeof taskModeValues)[number], string> = {
  INSTANT_CLAIM: "Instant claim",
  APPROVAL: "Approval required",
};

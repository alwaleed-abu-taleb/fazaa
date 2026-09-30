import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getCitiesWithDistricts } from "@/features/locations/queries";
import { CreateEventForm } from "@/features/events/components/CreateEventForm";

export const metadata: Metadata = { title: "Create event" };

export default async function NewEventPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ORGANIZER") redirect("/dashboard");

  const cities = await getCitiesWithDistricts();

  return (
    <div className="max-w-[42rem]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create an event</h1>
        <p className="mt-1 text-muted-foreground">
          Events start as drafts — publish when you&rsquo;re ready for volunteers to sign up.
        </p>
      </div>
      <CreateEventForm cities={cities} />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { EventCard } from "@/features/events/components/EventCard";
import { EventFilters } from "@/features/events/components/EventFilters";
import { getBrowseEvents } from "@/features/events/queries";
import { getCitiesWithDistricts, getPreferredCity } from "@/features/locations/queries";
import { getCurrentUser } from "@/server/auth";

export const metadata: Metadata = { title: "Browse events" };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const current = {
    q: typeof sp.q === "string" && sp.q.trim() ? sp.q.trim() : undefined,
    cityId: typeof sp.cityId === "string" && sp.cityId ? sp.cityId : undefined,
    districtId: typeof sp.districtId === "string" && sp.districtId ? sp.districtId : undefined,
    category: typeof sp.category === "string" && sp.category ? sp.category : undefined,
  };

  const user = await getCurrentUser();

  // Personalization applies only when the volunteer hasn't picked an explicit city filter.
  let preferred: { cityId: string; cityName: string } | null = null;
  if (user && !current.cityId) {
    const pref = await getPreferredCity(user.id);
    if (pref?.preferredCityId && pref.preferredCity) {
      preferred = { cityId: pref.preferredCityId, cityName: pref.preferredCity.name };
    }
  }

  const [events, cities] = await Promise.all([
    getBrowseEvents(current, preferred?.cityId),
    getCitiesWithDistricts(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Volunteer events</h1>
        <p className="mt-1 text-muted-foreground">
          {events.length > 0
            ? `${events.length} upcoming event${events.length === 1 ? "" : "s"} looking for hands.`
            : "Check back soon — new events are posted regularly."}
        </p>
      </div>

      {preferred && (
        <div className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm">
          <MapPin className="size-4 text-primary" />
          <span>
            Showing events in <span className="font-medium">{preferred.cityName}</span> first —
            based on your preferred city.
          </span>
          <Link
            href="/profile"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Change
          </Link>
        </div>
      )}

      <EventFilters cities={cities} current={current} />

      {events.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard
              key={e.id}
              id={e.id}
              title={e.title}
              city={e.cityObj?.name ?? e.city}
              districtName={e.district?.name}
              category={e.category}
              startsAt={e.startsAt}
              organizerName={e.organizer.organizerProfile?.orgName ?? e.organizer.name}
              organizerVerified={e.organizer.organizerProfile?.isVerified ?? false}
              slotsFilled={e.slotsFilled}
              slotsNeeded={e.slotsNeeded}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          {current.q || current.cityId || current.districtId || current.category
            ? "No events match those filters — try widening your search."
            : "No upcoming events yet. Organizers are cooking something up!"}
        </div>
      )}
    </div>
  );
}

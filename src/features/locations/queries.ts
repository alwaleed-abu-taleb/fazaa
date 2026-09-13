import { db } from "@/server/db";
import { EventStatus } from "@prisma/client";

export type CityWithDistricts = Awaited<ReturnType<typeof getCitiesWithDistricts>>[number];

/** All 12 governorates with their districts — consumed by forms and filters. */
export async function getCitiesWithDistricts() {
  return db.city.findMany({
    orderBy: { name: "asc" },
    include: { districts: { orderBy: { name: "asc" } } },
  });
}

export async function getDistrictsByCity(cityId: string) {
  return db.district.findMany({
    where: { cityId },
    orderBy: { name: "asc" },
  });
}

/** The signed-in user's saved preferred city (null when unset or no user). */
export async function getPreferredCity(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      preferredCityId: true,
      preferredCity: { select: { name: true, arabic: true } },
    },
  });
}

/** Published, upcoming events for a location — powers location-aware listings. */
export async function getEventsByLocation(cityId?: string, districtId?: string) {
  return db.event.findMany({
    where: {
      status: EventStatus.PUBLISHED,
      startsAt: { gte: new Date() },
      ...(cityId ? { cityId } : {}),
      ...(districtId ? { districtId } : {}),
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      title: true,
      city: true,
      startsAt: true,
      cityObj: { select: { name: true, arabic: true } },
      district: { select: { name: true, arabic: true } },
    },
  });
}

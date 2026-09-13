import type { PrismaClient } from "@prisma/client";

/**
 * Jordan's 12 governorates with the districts volunteers actually use.
 * Arabic names are filled in — EventFilters/CreateEventForm render them
 * alongside the English names.
 */
export const jordanCities: {
  name: string;
  arabic: string;
  districts: { name: string; arabic: string }[];
}[] = [
  {
    name: "Amman",
    arabic: "عمّان",
    districts: [
      { name: "Al Abdali", arabic: "العبدلي" },
      { name: "Al Weibdeh", arabic: "الجبيهة" },
      { name: "Jabal Amman", arabic: "جبل عمّان" },
      { name: "Shmeisani", arabic: "الشميساني" },
      { name: "Abdoun", arabic: "عبدون" },
      { name: "Sweifieh", arabic: "الصويفية" },
      { name: "Sahab", arabic: "سحاب" },
      { name: "Umm Uthaina", arabic: "أم أذينة" },
      { name: "Tla' Al Ali", arabic: "تلاع العلي" },
      { name: "Al Quweismeh", arabic: "القويسمة" },
      { name: "Al Rabwe", arabic: "الربوة" },
      { name: "Na'ur", arabic: "ناعور" },
    ],
  },
  {
    name: "Zarqa",
    arabic: "الزرقاء",
    districts: [
      { name: "Downtown", arabic: "وسط البلد" },
      { name: "Russeifa", arabic: "الرصيفة" },
      { name: "Al Hashmi", arabic: "الهاشمي" },
      { name: "Al Thuraiya", arabic: "الثريا" },
      { name: "Al Jazeera", arabic: "الجزيرة" },
    ],
  },
  {
    name: "Irbid",
    arabic: "إربد",
    districts: [
      { name: "Downtown", arabic: "وسط البلد" },
      { name: "Al Hashmi", arabic: "الهاشمي" },
      { name: "Ar Ramtha", arabic: "الرمثا" },
      { name: "Koura", arabic: "الكورة" },
      { name: "Bani Kenaneh", arabic: "بني كنانة" },
    ],
  },
  {
    name: "Salt",
    arabic: "السلط",
    districts: [
      { name: "Downtown", arabic: "وسط البلد" },
      { name: "Fuheis", arabic: "الفحيص" },
      { name: "Ain Ghazal", arabic: "عين غزال" },
    ],
  },
  {
    name: "Jerash",
    arabic: "جرش",
    districts: [
      { name: "Downtown", arabic: "وسط البلد" },
      { name: "Jerash Camp", arabic: "مخيم جرش" },
    ],
  },
  {
    name: "Aqaba",
    arabic: "العقبة",
    districts: [
      { name: "Downtown", arabic: "وسط البلد" },
      { name: "Al Saada", arabic: "السعادة" },
      { name: "South Beach", arabic: "شاطئ الجنوب" },
    ],
  },
  {
    name: "Karak",
    arabic: "الكرك",
    districts: [
      { name: "Downtown", arabic: "وسط البلد" },
      { name: "Al Ghor", arabic: "الغور" },
      { name: "Al Mujib", arabic: "الموجب" },
    ],
  },
  {
    name: "Tafilah",
    arabic: "الطفيلة",
    districts: [
      { name: "Downtown", arabic: "وسط البلد" },
      { name: "Jurf ed-Darawish", arabic: "جرف الدراويش" },
    ],
  },
  {
    name: "Ma'an",
    arabic: "معان",
    districts: [
      { name: "Downtown", arabic: "وسط البلد" },
      { name: "Wadi Musa", arabic: "وادي موسى" },
      { name: "Petra", arabic: "البتراء" },
    ],
  },
  {
    name: "Madaba",
    arabic: "مادبا",
    districts: [
      { name: "Downtown", arabic: "وسط البلد" },
      { name: "Mukawir", arabic: "مكاور" },
      { name: "Mount Nebo", arabic: "جبل نيبو" },
    ],
  },
  {
    name: "Balqa",
    arabic: "البلقاء",
    districts: [
      { name: "As-Salt", arabic: "السلط" },
      { name: "Fuheis", arabic: "الفحيص" },
      { name: "Dair Alla", arabic: "دير علا" },
      { name: "Sweimeh", arabic: "السويمة" },
    ],
  },
  {
    name: "Mafraq",
    arabic: "المفرق",
    districts: [
      { name: "Downtown", arabic: "وسط البلد" },
      { name: "Safawi", arabic: "الصفاوي" },
      { name: "Al Bayt", arabic: "البيت" },
    ],
  },
];

/** Idempotent — safe to run on every seed. */
export async function seedLocations(db: PrismaClient) {
  for (const city of jordanCities) {
    const created = await db.city.upsert({
      where: { name: city.name },
      update: { arabic: city.arabic },
      create: { name: city.name, arabic: city.arabic },
    });
    for (const district of city.districts) {
      await db.district.upsert({
        where: { name_cityId: { name: district.name, cityId: created.id } },
        update: { arabic: district.arabic },
        create: {
          name: district.name,
          arabic: district.arabic,
          cityId: created.id,
        },
      });
    }
  }
  const cityCount = await db.city.count();
  const districtCount = await db.district.count();
  console.log(`  locations: ${cityCount} cities, ${districtCount} districts`);
}

/**
 * Re-homes the demo events to Jordan (they were seeded with Saudi cities) and
 * links them to City/District rows so location filters and cards have data.
 * Matches by exact slug — user-created events are never touched.
 */
export async function linkDemoEventsToLocations(db: PrismaClient) {
  const moves: { slugPrefix: string; city: string; district: string }[] = [
    { slugPrefix: "red-sea-beach-cleanup", city: "Aqaba", district: "South Beach" },
    { slugPrefix: "jeddah-marathon-volunteers", city: "Amman", district: "Al Abdali" },
    { slugPrefix: "community-iftar-packing", city: "Zarqa", district: "Downtown" },
  ];

  for (const move of moves) {
    const event = await db.event.findFirst({
      where: { slug: { startsWith: move.slugPrefix } },
      select: { id: true, title: true },
    });
    if (!event) continue;

    const district = await db.district.findFirst({
      where: { name: move.district, city: { name: move.city } },
      select: { id: true, cityId: true, city: { select: { name: true } } },
    });
    if (!district) continue;

    await db.event.update({
      where: { id: event.id },
      data: {
        city: district.city.name,
        cityId: district.cityId,
        districtId: district.id,
      },
    });
    console.log(`  moved "${event.title}" → ${district.city.name} — ${move.district}`);
  }
}

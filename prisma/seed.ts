import { PrismaClient, EventCategory, EventStatus, TaskMode, TaskStatus, AssignmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedLocations, linkDemoEventsToLocations } from "./seed-locations";

const db = new PrismaClient();

const PASSWORD = "password123";

function daysFromNow(days: number, hour = 8) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const organizer = await db.user.upsert({
    where: { email: "organizer@fazaa.sa" },
    update: {},
    create: {
      name: "Faz'aa Initiative",
      email: "organizer@fazaa.sa",
      passwordHash,
      phone: "+966500000001",
      role: "ORGANIZER",
      organizerProfile: {
        create: {
          orgName: "Faz'aa Initiative",
          bio: "Community-led volunteering across the Kingdom.",
        },
      },
    },
    include: { organizerProfile: true },
  });

  const volunteer = await db.user.upsert({
    where: { email: "volunteer@fazaa.sa" },
    update: {},
    create: {
      name: "Alwaleed Volunteer",
      email: "volunteer@fazaa.sa",
      passwordHash,
      phone: "+966500000002",
      role: "VOLUNTEER",
    },
  });

  const sara = await db.user.upsert({
    where: { email: "sara@fazaa.sa" },
    update: {},
    create: {
      name: "Sara Alqhtani",
      email: "sara@fazaa.sa",
      passwordHash,
      phone: "+966500000003",
      role: "VOLUNTEER",
    },
  });

  await db.user.upsert({
    where: { email: "admin@fazaa.sa" },
    update: { role: "ADMIN" },
    create: {
      name: "Faz'aa Admin",
      email: "admin@fazaa.sa",
      passwordHash,
      role: "ADMIN",
    },
  });

  await seedLocations(db);

  // Idempotent: only seed events if the organizer has none.
  const existingEvents = await db.event.count({ where: { organizerId: organizer.id } });
  if (existingEvents > 0) {
    console.log("Seed data already present — linking demo events to Jordan locations.");
    await linkDemoEventsToLocations(db);
    return;
  }

  const aqaba = await db.city.findUniqueOrThrow({
    where: { name: "Aqaba" },
    include: { districts: true },
  });
  const amman = await db.city.findUniqueOrThrow({
    where: { name: "Amman" },
    include: { districts: true },
  });
  const zarqa = await db.city.findUniqueOrThrow({
    where: { name: "Zarqa" },
    include: { districts: true },
  });
  const aqabaSouthBeach = aqaba.districts.find((d) => d.name === "South Beach")!;
  const ammanAbdali = amman.districts.find((d) => d.name === "Al Abdali")!;
  const zarqaDowntown = zarqa.districts.find((d) => d.name === "Downtown")!;

  const cleanup = await db.event.create({
    data: {
      organizerId: organizer.id,
      title: "Red Sea beach cleanup — Aqaba South Beach",
      slug: `red-sea-beach-cleanup-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`,
      description:
        "Join us for a morning of giving back to the Red Sea. We'll split into teams to collect litter along the North Corniche, sort recyclables, and log what we find for the national marine litter database.\n\nWhat to bring: comfortable shoes, a hat, and sunscreen. Gloves, bags and water will be provided.",
      category: EventCategory.CLEANUP,
      status: EventStatus.PUBLISHED,
      city: aqaba.name,
      cityId: aqaba.id,
      districtId: aqabaSouthBeach.id,
      location: "South Beach, in front of the diving centers",
      startsAt: daysFromNow(7, 8),
      endsAt: daysFromNow(7, 12),
      tasks: {
        create: [
          {
            title: "Registration & welcome desk",
            description: "Check volunteers in, hand out gloves and bags.",
            requiredVolunteers: 2,
            mode: TaskMode.INSTANT_CLAIM,
            status: TaskStatus.OPEN,
          },
          {
            title: "Beach cleanup teams",
            description: "Walk your assigned stretch of beach and collect litter.",
            requiredVolunteers: 10,
            mode: TaskMode.INSTANT_CLAIM,
            status: TaskStatus.OPEN,
          },
          {
            title: "Water & first-aid station",
            description: "Keep everyone hydrated and safe. Prior first-aid experience preferred.",
            requiredVolunteers: 2,
            mode: TaskMode.APPROVAL,
            status: TaskStatus.OPEN,
          },
        ],
      },
    },
    include: { tasks: true },
  });

  const marathon = await db.event.create({
    data: {
      organizerId: organizer.id,
      title: "Amman marathon — volunteer crew",
      slug: `amman-marathon-volunteers-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`,
      description:
        "The capital's biggest running event needs its famous cheerful crew! Help with route marshalling, hydration points, and cheering thousands of runners across the finish line.",
      category: EventCategory.MARATHON,
      status: EventStatus.PUBLISHED,
      city: amman.name,
      cityId: amman.id,
      districtId: ammanAbdali.id,
      location: "Al Abdali Boulevard, main gate",
      startsAt: daysFromNow(14, 6),
      endsAt: daysFromNow(14, 13),
      tasks: {
        create: [
          {
            title: "Route marshals",
            description: "Guide runners and keep the route clear at your assigned corner.",
            requiredVolunteers: 8,
            mode: TaskMode.INSTANT_CLAIM,
            status: TaskStatus.OPEN,
          },
          {
            title: "Finish-line medal team",
            description: "Hand medals to finishers — the best job of the day.",
            requiredVolunteers: 4,
            mode: TaskMode.APPROVAL,
            status: TaskStatus.OPEN,
          },
        ],
      },
    },
    include: { tasks: true },
  });

  await db.event.create({
    data: {
      organizerId: organizer.id,
      title: "Community Iftar packing (draft)",
      slug: `community-iftar-packing-${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`,
      description:
        "A draft event for Ramadan planning — pack and distribute iftar boxes to families in need. Details and task breakdown to be finalized.",
      category: EventCategory.COMMUNITY,
      status: EventStatus.DRAFT,
      city: zarqa.name,
      cityId: zarqa.id,
      districtId: zarqaDowntown.id,
      location: "TBA",
      startsAt: daysFromNow(30, 16),
      tasks: {
        create: [
          {
            title: "Box packing line",
            requiredVolunteers: 12,
            mode: TaskMode.INSTANT_CLAIM,
            status: TaskStatus.OPEN,
          },
        ],
      },
    },
  });

  const desk = cleanup.tasks.find((t) => t.title.startsWith("Registration"))!;
  const teams = cleanup.tasks.find((t) => t.title.startsWith("Beach"))!;
  const water = cleanup.tasks.find((t) => t.title.startsWith("Water"))!;
  const marshals = marathon.tasks.find((t) => t.title.startsWith("Route"))!;

  await db.taskAssignment.createMany({
    data: [
      {
        taskId: desk.id,
        volunteerId: volunteer.id,
        status: AssignmentStatus.CONFIRMED,
      },
      {
        taskId: water.id,
        volunteerId: volunteer.id,
        status: AssignmentStatus.PENDING,
        note: "I'm a certified first-aider with the Saudi Red Crescent.",
      },
      {
        taskId: teams.id,
        volunteerId: sara.id,
        status: AssignmentStatus.CONFIRMED,
      },
      {
        taskId: marshals.id,
        volunteerId: sara.id,
        status: AssignmentStatus.CONFIRMED,
      },
    ],
  });

  console.log("Seeded:");
  console.log(`  admin@fazaa.sa / ${PASSWORD}     (ADMIN)`);
  console.log(`  organizer@fazaa.sa / ${PASSWORD}  (ORGANIZER)`);
  console.log(`  volunteer@fazaa.sa / ${PASSWORD}  (VOLUNTEER)`);
  console.log(`  sara@fazaa.sa / ${PASSWORD}       (VOLUNTEER)`);
  console.log(`  events: ${cleanup.title}, ${marathon.title} + 1 draft`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

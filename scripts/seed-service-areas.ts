import { db, pool } from "../server/db";
import { serviceAreas } from "../shared/schema";
import { eq } from "drizzle-orm";

const SERVICE_AREAS = [
  {
    name: "Southern California",
    slug: "southern-california",
    state: "CA",
    description:
      "Serving San Diego, Los Angeles, Orange County, and the Inland Empire with hands-on forklift certification and equipment training.",
    isActive: true,
    zipPrefixes: [
      "900","901","902","903","904","905","906","907","908","909",
      "910","911","912","913","914","915","916","917","918",
      "920","921","922","923","924","925","926","927","928",
    ],
    cities: [
      "San Diego","Los Angeles","Long Beach","Anaheim","Irvine",
      "Santa Ana","Huntington Beach","Garden Grove","Oceanside",
      "Costa Mesa","Mission Viejo","Chula Vista","Escondido",
      "Carlsbad","El Cajon","National City","Vista","San Marcos",
      "Temecula","Murrieta","Corona","Ontario","Rancho Cucamonga",
      "Fontana","San Bernardino","Pomona","Pasadena","Torrance",
      "Downey","Norwalk","Whittier","Compton","Inglewood",
      "El Monte","West Covina","Palmdale","Lancaster",
      "Santa Clarita","Glendale","Burbank","Oxnard","Ventura",
      "Thousand Oaks","Simi Valley","Orange County","Inland Empire",
    ],
    availabilityRules: {
      daysOfWeek: [1, 3, 5],
      timeSlots: [
        { startTime: "09:00", endTime: "12:00" },
        { startTime: "13:00", endTime: "16:00" },
      ],
      maxParticipants: 10,
      leadTimeDays: 2,
      windowDays: 90,
      blackoutDates: [],
    },
  },
  {
    name: "Central California",
    slug: "central-california",
    state: "CA",
    description:
      "Covering Fresno, Bakersfield, Visalia, and surrounding Central Valley communities with onsite forklift training and certification.",
    isActive: true,
    zipPrefixes: ["930","931","932","933","934","935","936","937","938","939"],
    cities: [
      "Fresno","Bakersfield","Visalia","Clovis","Hanford",
      "Tulare","Porterville","Madera","Merced","Delano",
    ],
    availabilityRules: {
      daysOfWeek: [1, 3, 5],
      timeSlots: [
        { startTime: "09:00", endTime: "12:00" },
        { startTime: "13:00", endTime: "16:00" },
      ],
      maxParticipants: 10,
      leadTimeDays: 2,
      windowDays: 90,
      blackoutDates: [],
    },
  },
  {
    name: "Southern Nevada",
    slug: "southern-nevada",
    state: "NV",
    description:
      "Providing hands-on forklift and equipment operator training in the Las Vegas metro area including Henderson and North Las Vegas.",
    isActive: true,
    zipPrefixes: ["890","891"],
    cities: [
      "Las Vegas","Henderson","North Las Vegas","Boulder City",
      "Mesquite","Pahrump",
    ],
    availabilityRules: {
      daysOfWeek: [1, 3, 5],
      timeSlots: [
        { startTime: "09:00", endTime: "12:00" },
        { startTime: "13:00", endTime: "16:00" },
      ],
      maxParticipants: 10,
      leadTimeDays: 2,
      windowDays: 90,
      blackoutDates: [],
    },
  },
];

async function seed() {
  console.log("[Seed Service Areas] Starting...");

  for (const area of SERVICE_AREAS) {
    const existing = await db
      .select()
      .from(serviceAreas)
      .where(eq(serviceAreas.slug, area.slug))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(serviceAreas)
        .set({
          name: area.name,
          state: area.state,
          description: area.description,
          isActive: area.isActive,
          zipPrefixes: area.zipPrefixes,
          cities: area.cities,
          availabilityRules: area.availabilityRules,
          updatedAt: new Date(),
        })
        .where(eq(serviceAreas.slug, area.slug));
      console.log(`  Updated: ${area.name} (id=${existing[0].id})`);
    } else {
      const [inserted] = await db
        .insert(serviceAreas)
        .values(area)
        .returning({ id: serviceAreas.id });
      console.log(`  Created: ${area.name} (id=${inserted.id})`);
    }
  }

  console.log(`[Seed Service Areas] Complete: ${SERVICE_AREAS.length} service areas configured with availability rules`);

  await pool.end();
}

seed().catch((err) => {
  console.error("[Seed Service Areas] Fatal error:", err);
  process.exit(1);
});

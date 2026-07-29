import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Demo seeder profile — replace with a real auth user id in production */
const SEED_USER_ID = "00000000-0000-4000-8000-000000000001";

const spots = [
  {
    name: "Jaffa Port",
    description:
      "Classic Mediterranean sunset over the old harbor — fishing boats, stone quays, and a wide western sky.",
    lat: 32.0525,
    lng: 34.7511,
    region: "Tel Aviv–Yafo",
  },
  {
    name: "Gordon Beach",
    description:
      "City shoreline with an open horizon. Arrive early for golden hour over the water.",
    lat: 32.0823,
    lng: 34.7685,
    region: "Tel Aviv",
  },
  {
    name: "Caesarea Aqueduct Beach",
    description:
      "Roman arches meet the sea. Soft light on sandstone and long reflections at dusk.",
    lat: 32.5085,
    lng: 34.8925,
    region: "Caesarea",
  },
  {
    name: "Bat Galim Promenade",
    description:
      "Haifa’s western edge — Carmel silhouette behind you, sun dropping into the bay.",
    lat: 32.8322,
    lng: 34.9724,
    region: "Haifa",
  },
  {
    name: "Achziv Beach",
    description:
      "Northern coast lagoons and rocky shelves. Quiet evenings when the wind settles.",
    lat: 33.0545,
    lng: 35.1025,
    region: "Western Galilee",
  },
  {
    name: "Netanya Cliff Park",
    description:
      "High kurkar cliffs overlooking the Mediterranean — dramatic silhouettes at sunset.",
    lat: 32.3285,
    lng: 34.8515,
    region: "Netanya",
  },
  {
    name: "Dead Sea — Ein Bokek view",
    description:
      "Pink-gold haze over the water as the sun sinks behind the Judean hills.",
    lat: 31.2,
    lng: 35.362,
    region: "Dead Sea",
  },
  {
    name: "Eilat North Beach",
    description:
      "Red Sea glow with Jordan and Egypt on the horizon — short winter sunsets, long summer ones.",
    lat: 29.5581,
    lng: 34.9515,
    region: "Eilat",
  },
  {
    name: "Jerusalem Tayelet",
    description:
      "Armon HaNatziv promenade — city and hills turning amber as the day closes.",
    lat: 31.7515,
    lng: 35.2375,
    region: "Jerusalem",
  },
  {
    name: "Ashkelon Marina",
    description:
      "Southern coast marina with a clear western view — calm water and soft evening color.",
    lat: 31.6825,
    lng: 34.5555,
    region: "Ashkelon",
  },
];

async function main() {
  await prisma.profile.upsert({
    where: { id: SEED_USER_ID },
    create: { id: SEED_USER_ID, displayName: "Demo Seeder" },
    update: { displayName: "Demo Seeder" },
  });

  const existing = await prisma.spot.count();
  if (existing > 0) {
    console.log(`Skip seed: ${existing} spots already exist.`);
    return;
  }

  await prisma.spot.createMany({
    data: spots.map((spot) => ({
      ...spot,
      createdById: SEED_USER_ID,
    })),
  });

  console.log(`Seeded ${spots.length} Israel sunset spots.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

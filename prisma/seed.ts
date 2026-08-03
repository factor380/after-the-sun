import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Demo seeder profile — replace with a real auth user id in production */
const SEED_USER_ID = "00000000-0000-4000-8000-000000000001";

const spots = [
  {
    name: "נמל יפו",
    description:
      "שקיעה ים־תיכונית קלאסית מעל הנמל העתיק — סירות דיג, רציפי אבן ושמיים רחבים למערב.",
    lat: 32.0525,
    lng: 34.7511,
    region: "תל אביב–יפו",
  },
  {
    name: "חוף גורדון",
    description:
      "קו החוף של העיר עם אופק פתוח. כדאי להגיע מוקדם לשעת הזהב מעל המים.",
    lat: 32.0823,
    lng: 34.7685,
    region: "תל אביב",
  },
  {
    name: "חוף אמת המים בקיסריה",
    description:
      "קשתות רומיות פוגשות את הים. אור רך על אבן החול והשתקפויות ארוכות בשעת בין־ערביים.",
    lat: 32.5085,
    lng: 34.8925,
    region: "קיסריה",
  },
  {
    name: "טיילת בת גלים",
    description:
      "הקצה המערבי של חיפה — צללית הכרמל מאחוריכם, והשמש יורדת אל המפרץ.",
    lat: 32.8322,
    lng: 34.9724,
    region: "חיפה",
  },
  {
    name: "חוף אכזיב",
    description:
      "לגונות וסלעים בחוף הצפוני. ערבים שקטים כשהרוח נרגעת.",
    lat: 33.0545,
    lng: 35.1025,
    region: "גליל מערבי",
  },
  {
    name: "פארק הצוק נתניה",
    description:
      "צוקי כורכר גבוהים מול הים התיכון — צלליות דרמטיות בשקיעה.",
    lat: 32.3285,
    lng: 34.8515,
    region: "נתניה",
  },
  {
    name: "חוף הצפון אילת",
    description:
      "זוהר ים סוף עם ירדן ומצרים באופק — שקיעות קצרות בחורף וארוכות בקיץ.",
    lat: 29.5581,
    lng: 34.9515,
    region: "אילת",
  },
  {
    name: "מרינה אשקלון",
    description:
      "מרינה בחוף הדרומי עם מבט מערבי פתוח — מים רגועים וצבעי ערב רכים.",
    lat: 31.6825,
    lng: 34.5555,
    region: "אשקלון",
  },
];

/** English names from older seeds — update matching rows to Hebrew */
const englishNameByLatLng = new Map(
  [
    ["Jaffa Port", spots[0]],
    ["Gordon Beach", spots[1]],
    ["Caesarea Aqueduct Beach", spots[2]],
    ["Bat Galim Promenade", spots[3]],
    ["Achziv Beach", spots[4]],
    ["Netanya Cliff Park", spots[5]],
    ["Eilat North Beach", spots[6]],
    ["Ashkelon Marina", spots[7]],
  ].map(([en, he]) => [en as string, he as (typeof spots)[number]]),
);

async function main() {
  await prisma.profile.upsert({
    where: { id: SEED_USER_ID },
    create: { id: SEED_USER_ID, displayName: "דמו" },
    update: { displayName: "דמו" },
  });

  const existing = await prisma.spot.findMany({
    select: { id: true, name: true, lat: true, lng: true },
  });

  if (existing.length === 0) {
    await prisma.spot.createMany({
      data: spots.map((spot) => ({
        ...spot,
        createdById: SEED_USER_ID,
      })),
    });
    console.log(`Seeded ${spots.length} Israel sunset spots (Hebrew).`);
    return;
  }

  let updated = 0;
  for (const row of existing) {
    const byName = englishNameByLatLng.get(row.name);
    const byCoords = byName
      ? byName
      : spots.find(
          (s) =>
            Math.abs(s.lat - row.lat) < 0.0001 &&
            Math.abs(s.lng - row.lng) < 0.0001,
        );
    if (!byCoords) continue;
    await prisma.spot.update({
      where: { id: row.id },
      data: {
        name: byCoords.name,
        description: byCoords.description,
        region: byCoords.region,
      },
    });
    updated += 1;
  }

  console.log(
    `Spots already present (${existing.length}). Updated ${updated} to Hebrew.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

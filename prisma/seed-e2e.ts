import { PrismaClient } from "@prisma/client";
import { assertLocalDatabase } from "../src/lib/e2e/local-database";
import { E2E_SEED_SPOTS, E2E_SEED_USER_ID } from "../src/lib/e2e/seed-spots";

const prisma = new PrismaClient();

async function main() {
  assertLocalDatabase(process.env.DATABASE_URL, "DATABASE_URL");
  assertLocalDatabase(process.env.DIRECT_URL, "DIRECT_URL");

  await prisma.spot.deleteMany();
  await prisma.profile.upsert({
    where: { id: E2E_SEED_USER_ID },
    create: { id: E2E_SEED_USER_ID, displayName: "E2E seed" },
    update: { displayName: "E2E seed" },
  });

  await prisma.spot.createMany({
    data: E2E_SEED_SPOTS.map((spot) => ({
      ...spot,
      photoUrl: null,
      parking: null,
      parkingNote: null,
      accessibility: null,
      accessibilityNote: null,
      createdById: E2E_SEED_USER_ID,
    })),
  });

  console.log(`Seeded ${E2E_SEED_SPOTS.length} local e2e spots.`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "";
    console.error(
      message && !/postgres(?:ql)?:\/\//i.test(message) ? message : "e2e seed failed",
    );
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

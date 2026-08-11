/**
 * Phase One seed: 1 zone, 1 district, 6 pilot villages (editable placeholder
 * names), 2 units each, and a sample voter roll (10 voters per village).
 * Idempotent: skips if villages already exist.
 *
 * Run: pnpm --filter @workspace/db exec tsx src/seed.ts
 */
import { db, pool } from "./index";
import {
  zonesTable,
  districtsTable,
  villagesTable,
  unitsTable,
  votersTable,
} from "./schema";

const VILLAGE_NAMES = [
  "Pilot Village One",
  "Pilot Village Two",
  "Pilot Village Three",
  "Pilot Village Four",
  "Pilot Village Five",
  "Pilot Village Six",
];

const FIRST_NAMES = [
  "Ebiere", "Tari", "Preye", "Timi", "Ayibaemi", "Doubara",
  "Ipigansi", "Kemen", "Seiyefa", "Tonbra", "Ebi", "Perekeme",
];
const LAST_NAMES = [
  "Okoro", "Ebiwei", "Amaebi", "Sagbama", "Kemefa", "Ogoni",
  "Doutimi", "Perewari", "Tamuno", "Ayah", "Firi", "Woyengi",
];

async function main() {
  const existing = await db.select().from(villagesTable).limit(1);
  if (existing.length) {
    console.log("Seed skipped: villages already exist.");
    return;
  }

  const [zone] = await db
    .insert(zonesTable)
    .values({ name: "Central Zone" })
    .returning();
  const [district] = await db
    .insert(districtsTable)
    .values({ zoneId: zone.id, name: "Sagbama Constituency One" })
    .returning();

  let voterSeq = 1;
  for (const name of VILLAGE_NAMES) {
    const [village] = await db
      .insert(villagesTable)
      .values({
        districtId: district.id,
        name,
        description: `${name} is one of the six pilot communities of Sagbama Constituency One in the Greater Bayelsa phase one rollout.`,
        whatsappGroupUrl: "https://wa.me/2340000000000",
      })
      .returning();
    const units = await db
      .insert(unitsTable)
      .values([
        { villageId: village.id, name: "Unit 1" },
        { villageId: village.id, name: "Unit 2" },
      ])
      .returning();

    const voters = Array.from({ length: 10 }, (_, i) => {
      const n = voterSeq++;
      return {
        firstName: FIRST_NAMES[(n + i) % FIRST_NAMES.length],
        lastName: LAST_NAMES[(n * 7 + i) % LAST_NAMES.length],
        gender: n % 2 === 0 ? "female" : "male",
        phone: `+23480${String(10000000 + n).slice(0, 8)}`,
        vin: `GB${String(n).padStart(8, "0")}`,
        dateOfBirth: `${1970 + (n % 35)}-0${(n % 9) + 1}-1${n % 9}`,
        occupation: ["farmer", "trader", "teacher", "fisher", "artisan"][n % 5],
        villageId: village.id,
        unitId: units[n % 2].id,
        pollingUnit: `${name} PU ${(n % 2) + 1}`,
      };
    });
    await db.insert(votersTable).values(voters);
  }
  console.log("Seeded 6 villages, 12 units, 60 sample voters.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

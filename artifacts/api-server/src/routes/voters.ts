import { Router, type IRouter } from "express";
import { and, eq, ilike, or, type SQL } from "drizzle-orm";
import { db, votersTable, villagesTable, unitsTable } from "@workspace/db";
import {
  ListVotersQueryParams,
  ListVotersResponse,
  ImportVotersBody,
  ImportVotersResponse,
} from "@workspace/api-zod";
import { requireHq } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/voters", requireHq, async (req, res): Promise<void> => {
  const parsed = ListVotersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const conds: SQL[] = [];
  if (parsed.data.villageId !== undefined)
    conds.push(eq(votersTable.villageId, parsed.data.villageId));
  if (parsed.data.search) {
    const s = `%${parsed.data.search}%`;
    conds.push(
      or(
        ilike(votersTable.firstName, s),
        ilike(votersTable.lastName, s),
        ilike(votersTable.vin, s),
        ilike(votersTable.phone, s),
      )!,
    );
  }
  const rows = await db
    .select()
    .from(votersTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(votersTable.lastName, votersTable.firstName)
    .limit(1000);
  res.json(ListVotersResponse.parse(rows.map(({ createdAt: _c, ...v }) => v)));
});

router.post("/voters/import", requireHq, async (req, res): Promise<void> => {
  const parsed = ImportVotersBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const villages = await db.select().from(villagesTable);
  const units = await db.select().from(unitsTable);
  let imported = 0;
  let skipped = 0;
  for (const row of parsed.data.rows) {
    const village = row.villageName
      ? villages.find(
          (v) => v.name.toLowerCase() === row.villageName!.toLowerCase(),
        )
      : undefined;
    const unit =
      row.unitName && village
        ? units.find(
            (u) =>
              u.villageId === village.id &&
              u.name.toLowerCase() === row.unitName!.toLowerCase(),
          )
        : undefined;
    if (row.vin) {
      const [dupe] = await db
        .select({ id: votersTable.id })
        .from(votersTable)
        .where(ilike(votersTable.vin, row.vin))
        .limit(1);
      if (dupe) {
        skipped++;
        continue;
      }
    }
    await db.insert(votersTable).values({
      firstName: row.firstName,
      lastName: row.lastName,
      gender: row.gender ?? null,
      phone: row.phone ?? null,
      vin: row.vin ?? null,
      dateOfBirth: row.dateOfBirth ?? null,
      occupation: row.occupation ?? null,
      villageId: village?.id ?? null,
      unitId: unit?.id ?? null,
    });
    imported++;
  }
  res.json(ImportVotersResponse.parse({ imported, skipped }));
});

export default router;

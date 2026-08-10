import { Router, type IRouter } from "express";
import { and, eq, ilike, or, desc, sql, countDistinct } from "drizzle-orm";
import { db, votersTable } from "@workspace/db";
import {
  ListVotersQueryParams,
  ListVotersResponse,
  CreateVoterBody,
  CreateVoterResponse,
  GetVoterParams,
  GetVoterResponse,
  UpdateVoterParams,
  UpdateVoterBody,
  UpdateVoterResponse,
  DeleteVoterParams,
  GetStatsSummaryResponse,
  GetStatsByLgaResponse,
  GetStatsBySupportLevelResponse,
  GetRecentVotersResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

// All voter data and voter statistics are staff-only (admin).
router.use(requireAdmin);

type VoterRow = typeof votersTable.$inferSelect;
const serializeVoter = (v: VoterRow) => ({
  ...v,
  createdAt: v.createdAt.toISOString(),
});

router.get("/voters", async (req, res): Promise<void> => {
  const parsed = ListVotersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, lga, ward, supportLevel, contactStatus } = parsed.data;

  const conditions = [];
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(votersTable.firstName, pattern),
        ilike(votersTable.lastName, pattern),
        ilike(votersTable.vin, pattern),
        ilike(votersTable.phone, pattern),
        ilike(
          sql`${votersTable.firstName} || ' ' || ${votersTable.lastName}`,
          pattern,
        ),
      ),
    );
  }
  if (lga) conditions.push(eq(votersTable.lga, lga));
  if (ward) conditions.push(ilike(votersTable.ward, `%${ward}%`));
  if (supportLevel) conditions.push(eq(votersTable.supportLevel, supportLevel));
  if (contactStatus)
    conditions.push(eq(votersTable.contactStatus, contactStatus));

  const voters = await db
    .select()
    .from(votersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(votersTable.createdAt));

  res.json(ListVotersResponse.parse(voters.map(serializeVoter)));
});

router.post("/voters", async (req, res): Promise<void> => {
  const parsed = CreateVoterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [voter] = await db.insert(votersTable).values(parsed.data).returning();
  res.status(201).json(CreateVoterResponse.parse(serializeVoter(voter)));
});

router.get("/voters/:id", async (req, res): Promise<void> => {
  const params = GetVoterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [voter] = await db
    .select()
    .from(votersTable)
    .where(eq(votersTable.id, params.data.id));
  if (!voter) {
    res.status(404).json({ error: "Voter not found" });
    return;
  }
  res.json(GetVoterResponse.parse(serializeVoter(voter)));
});

router.patch("/voters/:id", async (req, res): Promise<void> => {
  const params = UpdateVoterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateVoterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [voter] = await db
    .update(votersTable)
    .set(parsed.data)
    .where(eq(votersTable.id, params.data.id))
    .returning();
  if (!voter) {
    res.status(404).json({ error: "Voter not found" });
    return;
  }
  res.json(UpdateVoterResponse.parse(serializeVoter(voter)));
});

router.delete("/voters/:id", async (req, res): Promise<void> => {
  const params = DeleteVoterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [voter] = await db
    .delete(votersTable)
    .where(eq(votersTable.id, params.data.id))
    .returning();
  if (!voter) {
    res.status(404).json({ error: "Voter not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/stats/summary", async (_req, res): Promise<void> => {
  const [row] = await db
    .select({
      totalVoters: sql<number>`count(*)::int`,
      strongSupporters: sql<number>`count(*) filter (where ${votersTable.supportLevel} = 'strong')::int`,
      contacted: sql<number>`count(*) filter (where ${votersTable.contactStatus} <> 'not_contacted')::int`,
      notContacted: sql<number>`count(*) filter (where ${votersTable.contactStatus} = 'not_contacted')::int`,
      lgasCovered: countDistinct(votersTable.lga),
      wardsCovered: countDistinct(
        sql`${votersTable.lga} || '|' || ${votersTable.ward}`,
      ),
    })
    .from(votersTable);
  res.json(GetStatsSummaryResponse.parse(row));
});

router.get("/stats/by-lga", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      lga: votersTable.lga,
      count: sql<number>`count(*)::int`,
    })
    .from(votersTable)
    .groupBy(votersTable.lga)
    .orderBy(desc(sql`count(*)`));
  res.json(GetStatsByLgaResponse.parse(rows));
});

router.get("/stats/by-support-level", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      supportLevel: votersTable.supportLevel,
      count: sql<number>`count(*)::int`,
    })
    .from(votersTable)
    .groupBy(votersTable.supportLevel)
    .orderBy(desc(sql`count(*)`));
  res.json(GetStatsBySupportLevelResponse.parse(rows));
});

router.get("/stats/recent", async (_req, res): Promise<void> => {
  const voters = await db
    .select()
    .from(votersTable)
    .orderBy(desc(votersTable.createdAt))
    .limit(8);
  res.json(GetRecentVotersResponse.parse(voters.map(serializeVoter)));
});

export default router;

import { Router, type IRouter } from "express";
import { and, eq, ilike, or, sql, desc } from "drizzle-orm";
import { db, membersTable, votersTable, type Member } from "@workspace/db";
import {
  GetMeResponse,
  UpdateMeBody,
  UpdateMeResponse,
  GetMyCoordinatorResponse,
  MatchVoterQueryParams,
  MatchVoterResponse,
  ListMembersQueryParams,
  ListMembersResponse,
  RegisterMemberBody,
  RegisterMemberResponse,
  GetMemberParams,
  GetMemberResponse,
  AdminUpdateMemberParams,
  AdminUpdateMemberBody,
  AdminUpdateMemberResponse,
  GetMembersSummaryResponse,
} from "@workspace/api-zod";
import { requireAuth, requireMember, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const serializeMember = (m: Member) => ({
  ...m,
  createdAt: m.createdAt.toISOString(),
});

// Advisory lock key serializing member registration (code allocation + admin bootstrap)
const MEMBER_REGISTRATION_LOCK = 874_211;

router.get("/me", requireAuth, async (req, res): Promise<void> => {
  const [member] = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.clerkUserId, req.clerkUserId!))
    .limit(1);
  if (!member) {
    res.status(404).json({ error: "Not registered" });
    return;
  }
  res.json(GetMeResponse.parse(serializeMember(member)));
});

router.patch("/me", requireMember, async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(membersTable)
    .set(parsed.data)
    .where(eq(membersTable.id, req.member!.id))
    .returning();
  res.json(UpdateMeResponse.parse(serializeMember(updated)));
});

router.get("/me/coordinator", requireMember, async (req, res): Promise<void> => {
  const me = req.member!;
  const levels: Array<{ role: string; cond: ReturnType<typeof eq> }> = [
    { role: "unit_coordinator", cond: eq(membersTable.pollingUnit, me.pollingUnit) },
    { role: "ward_coordinator", cond: eq(membersTable.ward, me.ward) },
    { role: "lga_coordinator", cond: eq(membersTable.lga, me.lga) },
  ];
  for (const level of levels) {
    const [coordinator] = await db
      .select()
      .from(membersTable)
      .where(and(eq(membersTable.role, level.role), level.cond))
      .limit(1);
    if (coordinator && coordinator.id !== me.id) {
      res.json(GetMyCoordinatorResponse.parse(serializeMember(coordinator)));
      return;
    }
  }
  res.status(404).json({ error: "No coordinator assigned yet" });
});

router.get("/members/match", requireAuth, async (req, res): Promise<void> => {
  const parsed = MatchVoterQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const q = parsed.data.q.trim();
  const matches = await db
    .select()
    .from(votersTable)
    .where(or(eq(votersTable.vin, q), eq(votersTable.phone, q)))
    .limit(5);
  res.json(
    MatchVoterResponse.parse(
      matches.map((v) => ({
        id: v.id,
        firstName: v.firstName,
        lastName: v.lastName,
        gender: v.gender,
        occupation: v.occupation,
        dateOfBirth: v.dateOfBirth,
        lga: v.lga,
        ward: v.ward,
        pollingUnit: v.pollingUnit,
      })),
    ),
  );
});

router.post("/members", requireAuth, async (req, res): Promise<void> => {
  const parsed = RegisterMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db
    .select({ id: membersTable.id })
    .from(membersTable)
    .where(eq(membersTable.clerkUserId, req.clerkUserId!))
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "Already registered as a member" });
    return;
  }

  // Link to a voter record when VIN or phone matches
  const [voter] = await db
    .select()
    .from(votersTable)
    .where(
      or(
        eq(votersTable.vin, parsed.data.vin),
        eq(votersTable.phone, parsed.data.phone),
      ),
    )
    .limit(1);

  // Serialize registrations so first-admin bootstrap and code allocation are race-free.
  const created = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${MEMBER_REGISTRATION_LOCK})`,
    );
    const [maxRow] = await tx
      .select({
        maxCode: sql<
          number | null
        >`max(substring(${membersTable.membershipCode} from 4)::int)`,
        count: sql<number>`count(*)::int`,
      })
      .from(membersTable);
    const isFirstMember = (maxRow?.count ?? 0) === 0;
    const membershipCode = `GB-${String((maxRow?.maxCode ?? 0) + 1).padStart(5, "0")}`;
    const [row] = await tx
      .insert(membersTable)
      .values({
        ...parsed.data,
        clerkUserId: req.clerkUserId!,
        membershipCode,
        voterId: voter?.id ?? null,
        role: isFirstMember ? "admin" : "member",
        status: "active",
      })
      .returning();
    return row;
  });
  res.status(201).json(RegisterMemberResponse.parse(serializeMember(created)));
});

router.get("/members", requireAdmin, async (req, res): Promise<void> => {
  const parsed = ListMembersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, lga, ward, role, status } = parsed.data;
  const conditions = [];
  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        ilike(membersTable.firstName, pattern),
        ilike(membersTable.lastName, pattern),
        ilike(membersTable.membershipCode, pattern),
        ilike(membersTable.vin, pattern),
        ilike(membersTable.phone, pattern),
        ilike(
          sql`${membersTable.firstName} || ' ' || ${membersTable.lastName}`,
          pattern,
        ),
      ),
    );
  }
  if (lga) conditions.push(eq(membersTable.lga, lga));
  if (ward) conditions.push(ilike(membersTable.ward, `%${ward}%`));
  if (role) conditions.push(eq(membersTable.role, role));
  if (status) conditions.push(eq(membersTable.status, status));

  const members = await db
    .select()
    .from(membersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(membersTable.createdAt));
  res.json(ListMembersResponse.parse(members.map(serializeMember)));
});

router.get("/members/:id", requireAdmin, async (req, res): Promise<void> => {
  const parsed = GetMemberParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [member] = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.id, parsed.data.id))
    .limit(1);
  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  res.json(GetMemberResponse.parse(serializeMember(member)));
});

router.patch("/members/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = AdminUpdateMemberParams.safeParse(req.params);
  const body = AdminUpdateMemberBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({
      error: params.success ? body.error?.message : params.error.message,
    });
    return;
  }
  const [updated] = await db
    .update(membersTable)
    .set(body.data)
    .where(eq(membersTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  res.json(AdminUpdateMemberResponse.parse(serializeMember(updated)));
});

router.get(
  "/stats/members-summary",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const [row] = await db
      .select({
        totalMembers: sql<number>`count(*)::int`,
        activeMembers: sql<number>`count(*) filter (where ${membersTable.status} = 'active')::int`,
        pendingMembers: sql<number>`count(*) filter (where ${membersTable.status} = 'pending')::int`,
        coordinators: sql<number>`count(*) filter (where ${membersTable.role} like '%coordinator')::int`,
      })
      .from(membersTable);
    res.json(GetMembersSummaryResponse.parse(row));
  },
);

export default router;

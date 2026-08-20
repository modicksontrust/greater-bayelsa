import { Router, type IRouter } from "express";
import { and, eq, ilike, or, sql, count, isNull, inArray, type SQL } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import {
  db,
  usersTable,
  votersTable,
  villagesTable,
  unitsTable,
  leadershipTable,
  hqRequestsTable,
  feedbackReportsTable,
  uploadsTable,
  duesPaymentsTable,
  trainingSessionsTable,
  trainingRegistrationsTable,
  notificationsTable,
  type User,
} from "@workspace/db";
import {
  GetMeResponse,
  UpdateMeBody,
  UpdateMeResponse,
  ListMembersQueryParams,
  ListMembersResponse,
  EnrollMemberBody,
  EnrollMemberResponse,
  MatchVoterResponse,
  GetMemberResponse,
  UpdateMemberBody,
  UpdateMemberResponse,
  GetOverviewStatsResponse,
  InductionUploadMemberBody,
  InductionUploadMemberResponse,
  ConfirmMemberInductionResponse,
} from "@workspace/api-zod";
import {
  requireAuth,
  requireUser,
  requireCoordinator,
  requireHq,
  isHq,
} from "../middlewares/auth";

const router: IRouter = Router();

const ENROLLMENT_LOCK = 874_213;

export async function serializeUser(u: User) {
  const village = u.villageId
    ? (
        await db
          .select({ name: villagesTable.name })
          .from(villagesTable)
          .where(eq(villagesTable.id, u.villageId))
          .limit(1)
      )[0]
    : null;
  const unit = u.unitId
    ? (
        await db
          .select({ name: unitsTable.name })
          .from(unitsTable)
          .where(eq(unitsTable.id, u.unitId))
          .limit(1)
      )[0]
    : null;
  const completions = await db
    .select({
      sessionId: trainingRegistrationsTable.sessionId,
      title: trainingSessionsTable.title,
      skillArea: trainingSessionsTable.skillArea,
      completedAt: trainingRegistrationsTable.completedAt,
    })
    .from(trainingRegistrationsTable)
    .innerJoin(
      trainingSessionsTable,
      eq(trainingRegistrationsTable.sessionId, trainingSessionsTable.id),
    )
    .where(
      and(
        eq(trainingRegistrationsTable.userId, u.id),
        eq(trainingRegistrationsTable.status, "completed"),
      ),
    );
  return {
    ...u,
    villageName: village?.name ?? null,
    unitName: unit?.name ?? null,
    createdAt: u.createdAt.toISOString(),
    inductedAt: u.inductedAt?.toISOString() ?? null,
    trainingCompletions: completions.map((c) => ({
      ...c,
      completedAt: c.completedAt?.toISOString() ?? null,
    })),
  };
}

/** Visibility scope: HQ = all, village executive = own village, unit leader = own unit, member = self */
export function scopeCondition(user: User): SQL | undefined {
  if (isHq(user)) return undefined;
  if (
    ["village_head", "secretary", "treasurer"].includes(user.role) &&
    user.villageId
  )
    return eq(usersTable.villageId, user.villageId);
  if (user.role === "unit_leader" && user.unitId)
    return eq(usersTable.unitId, user.unitId);
  return eq(usersTable.id, user.id);
}

router.get("/me", requireUser, async (req, res): Promise<void> => {
  res.json(GetMeResponse.parse(await serializeUser(req.user!)));
});

router.patch("/me", requireUser, async (req, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, req.user!.id))
    .returning();
  res.json(UpdateMeResponse.parse(await serializeUser(updated)));
});

router.get("/members", requireUser, async (req, res): Promise<void> => {
  const parsed = ListMembersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const q = parsed.data;
  const conds: SQL[] = [];
  const scope = scopeCondition(req.user!);
  if (scope) conds.push(scope);
  if (q.villageId !== undefined)
    conds.push(eq(usersTable.villageId, q.villageId));
  if (q.unitId !== undefined) conds.push(eq(usersTable.unitId, q.unitId));
  if (q.role) conds.push(eq(usersTable.role, q.role));
  if (q.status) conds.push(eq(usersTable.status, q.status));
  if (q.search) {
    conds.push(
      or(
        ilike(usersTable.firstName, `%${q.search}%`),
        ilike(usersTable.lastName, `%${q.search}%`),
        ilike(usersTable.membershipCode, `%${q.search}%`),
        ilike(usersTable.phone, `%${q.search}%`),
        ilike(usersTable.vin, `%${q.search}%`),
      )!,
    );
  }
  const rows = await db
    .select({
      user: usersTable,
      villageName: villagesTable.name,
      unitName: unitsTable.name,
    })
    .from(usersTable)
    .leftJoin(villagesTable, eq(usersTable.villageId, villagesTable.id))
    .leftJoin(unitsTable, eq(usersTable.unitId, unitsTable.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(usersTable.lastName, usersTable.firstName)
    .limit(500);
  res.json(
    ListMembersResponse.parse(
      rows.map((r) => ({
        ...r.user,
        villageName: r.villageName,
        unitName: r.unitName,
        createdAt: r.user.createdAt.toISOString(),
        inductedAt: r.user.inductedAt?.toISOString() ?? null,
      })),
    ),
  );
});

router.get("/members/birthdays", requireUser, async (req, res): Promise<void> => {
  const days = Math.min(Math.max(Number(req.query.days ?? 30), 1), 90);
  const scope = scopeCondition(req.user!);

  const members = await db
    .select({
      id: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      dateOfBirth: usersTable.dateOfBirth,
      photoUrl: usersTable.photoUrl,
      membershipCode: usersTable.membershipCode,
      villageId: usersTable.villageId,
      unitId: usersTable.unitId,
    })
    .from(usersTable)
    .where(
      and(
        scope,
        sql`${usersTable.dateOfBirth} IS NOT NULL`,
        eq(usersTable.status, "active"),
      ),
    );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const withDays = members
    .map((m) => {
      const dob = new Date(m.dateOfBirth!);
      let bday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (bday < today) bday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
      const daysUntil = Math.round((bday.getTime() - today.getTime()) / 86_400_000);
      return { ...m, daysUntil };
    })
    .filter((m) => m.daysUntil <= days)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 20);

  // Fetch village/unit names in one shot
  const { villagesTable, unitsTable } = await import("@workspace/db");
  const villageIds = [...new Set(withDays.map((m) => m.villageId).filter(Boolean))] as number[];
  const unitIds    = [...new Set(withDays.map((m) => m.unitId).filter(Boolean))]    as number[];
  const [vRows, uRows] = await Promise.all([
    villageIds.length ? db.select({ id: villagesTable.id, name: villagesTable.name }).from(villagesTable).where(inArray(villagesTable.id, villageIds)) : [],
    unitIds.length    ? db.select({ id: unitsTable.id,   name: unitsTable.name   }).from(unitsTable).where(inArray(unitsTable.id,    unitIds))    : [],
  ]);
  const vMap = Object.fromEntries(vRows.map((v) => [v.id, v.name]));
  const uMap = Object.fromEntries(uRows.map((u) => [u.id, u.name]));

  res.json(
    withDays.map((m) => ({
      id:             m.id,
      firstName:      m.firstName,
      lastName:       m.lastName,
      dateOfBirth:    m.dateOfBirth,
      photoUrl:       m.photoUrl ?? null,
      membershipCode: m.membershipCode,
      villageName:    m.villageId ? (vMap[m.villageId] ?? null) : null,
      unitName:       m.unitId    ? (uMap[m.unitId]    ?? null) : null,
      daysUntil:      m.daysUntil,
    })),
  );
});

router.get("/members/match", requireCoordinator, async (req, res): Promise<void> => {
  const q = String(req.query.q ?? "").trim();
  if (q.length < 3) {
    res.status(400).json({ error: "Query too short" });
    return;
  }
  const rows = await db
    .select()
    .from(votersTable)
    .where(
      or(
        ilike(votersTable.vin, `%${q}%`),
        ilike(votersTable.phone, `%${q}%`),
        ilike(votersTable.firstName, `%${q}%`),
        ilike(votersTable.lastName, `%${q}%`),
      ),
    )
    .limit(10);
  res.json(MatchVoterResponse.parse(rows.map(({ createdAt: _c, ...v }) => v)));
});

function ageOn(dateOfBirth: string, on: Date): number {
  const dob = new Date(dateOfBirth);
  let age = on.getFullYear() - dob.getFullYear();
  const m = on.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && on.getDate() < dob.getDate())) age--;
  return age;
}

router.post("/members", requireCoordinator, async (req, res): Promise<void> => {
  const parsed = EnrollMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const body = parsed.data;
  const enroller = req.user!;

  // Coordinators can only enroll within their own scope
  if (enroller.role === "unit_leader" && body.unitId !== enroller.unitId) {
    res.status(403).json({ error: "You can only enroll members into your own unit" });
    return;
  }
  if (
    enroller.role === "village_head" &&
    body.villageId !== enroller.villageId
  ) {
    res.status(403).json({ error: "You can only enroll members into your own village" });
    return;
  }

  if (ageOn(body.dateOfBirth, new Date()) < 18) {
    res.status(400).json({ error: "Members must be at least 18 years old" });
    return;
  }
  if (!body.cvUrl && !body.bio) {
    res.status(400).json({
      error: "Provide a CV upload or a coordinator-written bio",
    });
    return;
  }

  // Cross-check against the voter roll by VIN
  const [voter] = await db
    .select()
    .from(votersTable)
    .where(ilike(votersTable.vin, body.vin.trim()))
    .limit(1);
  if (!voter) {
    res.status(400).json({
      error:
        "VIN not found on the constituency voter roll. Verify the voter card details.",
    });
    return;
  }
  // Verify referenced uploads (photo, optional CV) belong to the enroller.
  const referencedPaths = [body.photoUrl, body.cvUrl].filter(
    (p): p is string => Boolean(p),
  );
  if (referencedPaths.length) {
    const owned = await db
      .select({ objectPath: uploadsTable.objectPath })
      .from(uploadsTable)
      .where(
        and(
          inArray(uploadsTable.objectPath, referencedPaths),
          eq(uploadsTable.ownerId, enroller.id),
        ),
      );
    if (owned.length !== new Set(referencedPaths).size) {
      res.status(400).json({
        error: "One or more uploaded files were not uploaded by your account",
      });
      return;
    }
  }
  if (voter.villageId && voter.villageId !== body.villageId) {
    res.status(400).json({
      error:
        "This voter is registered under a different village. Enroll them through their own village coordinator.",
    });
    return;
  }

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(ilike(usersTable.vin, body.vin.trim()))
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "A member with this VIN is already enrolled" });
    return;
  }

  // Create the Clerk login
  const loginEmail =
    body.email && body.email.includes("@") ? body.email : null;
  let clerkUserId: string;
  try {
    const created = await clerkClient.users.createUser({
      ...(loginEmail
        ? { emailAddress: [loginEmail] }
        : {
            emailAddress: [
              `member.${body.vin.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}@greaterbayelsa.members`,
            ],
          }),
      password: body.password,
      firstName: body.firstName,
      lastName: body.lastName,
      skipPasswordChecks: false,
    });
    clerkUserId = created.id;
  } catch (err) {
    const msg =
      err && typeof err === "object" && "errors" in err
        ? JSON.stringify((err as { errors: unknown }).errors)
        : String(err);
    res.status(409).json({ error: `Could not create login account: ${msg}` });
    return;
  }

  let created;
  try {
    created = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${ENROLLMENT_LOCK})`);
    // Derive the next code from the highest existing code, not the row count,
    // so deletions can never cause a collision.
    const [top] = await tx
      .select({ code: usersTable.membershipCode })
      .from(usersTable)
      .orderBy(sql`${usersTable.membershipCode} DESC`)
      .limit(1);
    const nextNum = top ? parseInt(top.code.replace(/\D/g, ""), 10) + 1 : 1;
    const code = `GB-${String(nextNum).padStart(4, "0")}`;
    const [row] = await tx
      .insert(usersTable)
      .values({
        clerkUserId,
        membershipCode: code,
        role: "member",
        membershipCategory: body.membershipCategory,
        joinDate: new Date().toISOString().slice(0, 10),
        firstName: body.firstName,
        lastName: body.lastName,
        gender: body.gender ?? voter.gender,
        dateOfBirth: body.dateOfBirth,
        phone: body.phone,
        phone2: body.phone2 ?? null,
        phone3: body.phone3 ?? null,
        whatsapp: body.whatsapp ?? null,
        email: loginEmail,
        photoUrl: body.photoUrl,
        vin: body.vin.trim(),
        voterId: voter.id,
        stateOfOrigin: body.stateOfOrigin ?? null,
        occupation: body.occupation ?? null,
        address: body.address ?? null,
        maritalStatus: body.maritalStatus,
        nextOfKinName: body.nextOfKinName ?? null,
        nextOfKinPhone: body.nextOfKinPhone ?? null,
        cvUrl: body.cvUrl ?? null,
        bio: body.bio ?? null,
        bankName: body.bankName ?? null,
        bankAccountName: body.bankAccountName ?? null,
        bankAccountNumber: body.bankAccountNumber ?? null,
        villageId: body.villageId,
        unitId: body.unitId,
        enrolledById: enroller.id,
      })
      .returning();
    return row;
    });
  } catch (err) {
    // Compensate: remove the just-created Clerk login so a DB failure
    // cannot leave an orphaned account able to sign in.
    try {
      await clerkClient.users.deleteUser(clerkUserId);
    } catch (cleanupErr) {
      req.log.error({ err: cleanupErr }, "Failed to clean up Clerk user after enrollment failure");
    }
    throw err;
  }

  res.status(201).json(EnrollMemberResponse.parse(await serializeUser(created)));
});

// POST /members/:id/induction-upload — member submits pledge video + 2 photos
router.post("/members/:id/induction-upload", requireUser, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const caller = req.user!;

  // Only the member themselves may submit their own pledge
  if (caller.id !== id) {
    res.status(403).json({ error: "You may only submit your own induction pledge" });
    return;
  }

  const parsed = InductionUploadMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Gate: dues must be paid for the current period
  const period = new Date().toISOString().slice(0, 7);
  const [payment] = await db
    .select({ id: duesPaymentsTable.id })
    .from(duesPaymentsTable)
    .where(and(eq(duesPaymentsTable.userId, id), eq(duesPaymentsTable.period, period)))
    .limit(1);
  if (!payment) {
    res.status(400).json({ error: "Current-period dues must be paid before submitting induction pledge" });
    return;
  }

  // Gate: must not have already submitted or been inducted
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!target) { res.status(404).json({ error: "Member not found" }); return; }
  if (target.inductionStatus !== "not_started") {
    res.status(400).json({ error: "Pledge already submitted or member already inducted" });
    return;
  }

  // Gate: must be vetted
  if (target.vettingStatus !== "vetted") {
    res.status(400).json({ error: "Member must be vetted before submitting induction evidence" });
    return;
  }

  // Validate distinct paths.
  // Each slot (video, photo1, photo2) must reference a different object. Without
  // this check a member could reuse a single file they own across multiple slots
  // (e.g. photo1 === photo2), bypassing the intent that each slot captures a
  // distinct piece of ceremony evidence. The ownership query below looks up each
  // path individually, so it would not catch duplicates on its own.
  const { inductionVideoPath, inductionPhoto1Path, inductionPhoto2Path } = parsed.data;
  const paths = [inductionVideoPath, inductionPhoto1Path, inductionPhoto2Path];
  if (new Set(paths).size !== 3) {
    res.status(400).json({ error: "All three paths must be distinct files" });
    return;
  }

  // Validate that each path is an upload owned by caller with the correct purpose
  const uploads = await db
    .select({ objectPath: uploadsTable.objectPath, purpose: uploadsTable.purpose })
    .from(uploadsTable)
    .where(and(inArray(uploadsTable.objectPath, paths), eq(uploadsTable.ownerId, caller.id)));

  const byPath = Object.fromEntries(uploads.map((u) => [u.objectPath, u.purpose]));

  if (byPath[inductionVideoPath] !== "induction_video") {
    res.status(400).json({ error: "Pledge video must be uploaded with purpose 'induction_video'" });
    return;
  }
  if (byPath[inductionPhoto1Path] !== "induction_photo") {
    res.status(400).json({ error: "Ceremony photo 1 must be uploaded with purpose 'induction_photo'" });
    return;
  }
  if (byPath[inductionPhoto2Path] !== "induction_photo") {
    res.status(400).json({ error: "Ceremony photo 2 must be uploaded with purpose 'induction_photo'" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      inductionStatus: "pledge_submitted",
      inductionVideoPath: parsed.data.inductionVideoPath,
      inductionPhoto1Path: parsed.data.inductionPhoto1Path,
      inductionPhoto2Path: parsed.data.inductionPhoto2Path,
    })
    .where(eq(usersTable.id, id))
    .returning();

  res.json(InductionUploadMemberResponse.parse(await serializeUser(updated)));
});

// POST /members/:id/induction-confirm — village head / HQ confirms induction
router.post("/members/:id/induction-confirm", requireUser, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const caller = req.user!;

  // Restricted to village_head only (not HQ-level roles — confirmation is a local VH responsibility)
  if (caller.role !== "village_head") {
    res.status(403).json({ error: "Only Village Heads may confirm inductions" });
    return;
  }

  const scope = scopeCondition(caller);
  const [target] = await db
    .select()
    .from(usersTable)
    .where(scope ? and(eq(usersTable.id, id), scope) : eq(usersTable.id, id))
    .limit(1);
  if (!target) { res.status(404).json({ error: "Member not found or outside your scope" }); return; }

  if (target.inductionStatus !== "pledge_submitted") {
    res.status(400).json({ error: "Member has not submitted pledge evidence yet" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      inductionStatus: "inducted",
      inductedAt: new Date(),
      status: "active",
    })
    .where(eq(usersTable.id, id))
    .returning();

  // Notify the member that their induction has been confirmed
  await db.insert(notificationsTable).values({
    userId: id,
    kind: "induction_confirmed",
    title: "Induction Confirmed 🎉",
    body: `Congratulations! Your induction into the Greater Bayelsa Movement has been confirmed by your Village Head. Welcome as a full member.`,
  });

  res.json(ConfirmMemberInductionResponse.parse(await serializeUser(updated)));
});

router.get("/members/:id", requireUser, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const scope = scopeCondition(req.user!);
  const [user] = await db
    .select()
    .from(usersTable)
    .where(scope ? and(eq(usersTable.id, id), scope) : eq(usersTable.id, id))
    .limit(1);
  if (!user) {
    res.status(404).json({ error: "Member not found" });
    return;
  }
  res.json(GetMemberResponse.parse(await serializeUser(user)));
});

router.patch("/members/:id", requireCoordinator, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const parsed = UpdateMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const caller = req.user!;
  const changes = parsed.data;
  // Only HQ may change roles / placement / vetting
  if (
    !isHq(caller) &&
    (changes.role !== undefined ||
      changes.villageId !== undefined ||
      changes.unitId !== undefined ||
      changes.vettingStatus !== undefined ||
      changes.credentials !== undefined)
  ) {
    res.status(403).json({ error: "Only headquarters can change roles or placement" });
    return;
  }
  const scope = scopeCondition(caller);
  const [target] = await db
    .select()
    .from(usersTable)
    .where(scope ? and(eq(usersTable.id, id), scope) : eq(usersTable.id, id))
    .limit(1);
  if (!target) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(changes)
    .where(eq(usersTable.id, id))
    .returning();

  // Maintain leadership tenure records on role change
  if (changes.role !== undefined && changes.role !== target.role) {
    const today = new Date().toISOString().slice(0, 10);
    await db
      .update(leadershipTable)
      .set({ endDate: today })
      .where(
        and(eq(leadershipTable.userId, id), isNull(leadershipTable.endDate)),
      );
    if (changes.role !== "member") {
      await db.insert(leadershipTable).values({
        userId: id,
        role: changes.role,
        villageId: updated.villageId,
        unitId: updated.unitId,
        startDate: today,
      });
    }
  }

  res.json(UpdateMemberResponse.parse(await serializeUser(updated)));
});

router.get("/stats/overview", requireUser, async (req, res): Promise<void> => {
  const user = req.user!;
  const scope = scopeCondition(user);
  const members = await db
    .select({
      id: usersTable.id,
      villageId: usersTable.villageId,
      unitId: usersTable.unitId,
      status: usersTable.status,
      role: usersTable.role,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
    })
    .from(usersTable)
    .where(scope);
  const villages = await db.select().from(villagesTable).orderBy(villagesTable.id);
  const units = await db.select().from(unitsTable).orderBy(unitsTable.id);

  const visibleVillages = villages.filter((v) => {
    if (isHq(user)) return true;
    return v.id === user.villageId;
  });

  let pendingHqRequests = 0;
  let openFeedback = 0;
  if (isHq(user)) {
    const [[hq], [fb]] = await Promise.all([
      db
        .select({ n: count() })
        .from(hqRequestsTable)
        .where(eq(hqRequestsTable.status, "open")),
      db
        .select({ n: count() })
        .from(feedbackReportsTable)
        .where(eq(feedbackReportsTable.status, "open")),
    ]);
    pendingHqRequests = hq.n;
    openFeedback = fb.n;
  }

  res.json(
    GetOverviewStatsResponse.parse({
      totalMembers: members.length,
      activeMembers: members.filter((m) => m.status === "active").length,
      pendingHqRequests,
      openFeedback,
      villages: visibleVillages.map((v) => {
        const vm = members.filter((m) => m.villageId === v.id);
        return {
          villageId: v.id,
          villageName: v.name,
          memberCount: vm.length,
          activeCount: vm.filter((m) => m.status === "active").length,
          units: units
            .filter((u) => u.villageId === v.id)
            .map((u) => {
              const leader = members.find(
                (m) => m.unitId === u.id && m.role === "unit_leader",
              );
              return {
                unitId: u.id,
                unitName: u.name,
                memberCount: vm.filter((m) => m.unitId === u.id).length,
                leaderName: leader
                  ? `${leader.firstName} ${leader.lastName}`
                  : null,
              };
            }),
        };
      }),
    }),
  );
});

export { requireAuth, requireHq };
export default router;

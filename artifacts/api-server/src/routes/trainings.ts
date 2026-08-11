import { Router, type IRouter } from "express";
import { and, eq, count, inArray, isNull, or, type SQL } from "drizzle-orm";
import {
  db,
  trainingSessionsTable,
  trainingRegistrationsTable,
  duesPaymentsTable,
  usersTable,
  villagesTable,
  type User,
} from "@workspace/db";
import {
  ListTrainingsResponse,
  CreateTrainingBody,
  CreateTrainingResponse,
  RegisterTrainingResponse,
  UpdateTrainingProgressBody,
  UpdateTrainingProgressResponse,
  ListTrainingRegistrantsResponse,
} from "@workspace/api-zod";
import { requireUser, requireRole, requireHq } from "../middlewares/auth";

const router: IRouter = Router();

const HQ_ROLES = ["founder", "assistant"];
const EXECUTIVE_ROLES = ["village_head", "secretary", "treasurer"];
const isHq = (u: User) => HQ_ROLES.includes(u.role);

// Sessions visible to a member: HQ-wide (villageId null) or their own village.
function visibilityCondition(user: User): SQL | undefined {
  if (isHq(user)) return undefined;
  return or(
    isNull(trainingSessionsTable.villageId),
    eq(trainingSessionsTable.villageId, user.villageId ?? -1),
  );
}

router.get("/trainings", requireUser, async (req, res): Promise<void> => {
  const caller = req.user!;
  const cond = visibilityCondition(caller);
  const sessions = await db
    .select({
      session: trainingSessionsTable,
      villageName: villagesTable.name,
    })
    .from(trainingSessionsTable)
    .leftJoin(villagesTable, eq(trainingSessionsTable.villageId, villagesTable.id))
    .where(cond)
    .orderBy(trainingSessionsTable.scheduledOn);

  const ids = sessions.map((s) => s.session.id);
  const counts = ids.length
    ? await db
        .select({ sessionId: trainingRegistrationsTable.sessionId, n: count() })
        .from(trainingRegistrationsTable)
        .where(inArray(trainingRegistrationsTable.sessionId, ids))
        .groupBy(trainingRegistrationsTable.sessionId)
    : [];
  const mine = ids.length
    ? await db
        .select({
          sessionId: trainingRegistrationsTable.sessionId,
          status: trainingRegistrationsTable.status,
        })
        .from(trainingRegistrationsTable)
        .where(
          and(
            inArray(trainingRegistrationsTable.sessionId, ids),
            eq(trainingRegistrationsTable.userId, caller.id),
          ),
        )
    : [];

  res.json(
    ListTrainingsResponse.parse(
      sessions.map(({ session, villageName }) => ({
        ...session,
        villageName,
        registeredCount: counts.find((c) => c.sessionId === session.id)?.n ?? 0,
        myRegistrationStatus:
          mine.find((m) => m.sessionId === session.id)?.status ?? null,
        createdAt: session.createdAt.toISOString(),
      })),
    ),
  );
});

router.post("/trainings", requireHq, async (req, res): Promise<void> => {
  const parsed = CreateTrainingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const caller = req.user!;
  const [session] = await db
    .insert(trainingSessionsTable)
    .values({ ...parsed.data, createdById: caller.id })
    .returning();
  res.status(201).json(
    CreateTrainingResponse.parse({
      ...session,
      villageName: null,
      registeredCount: 0,
      myRegistrationStatus: null,
      createdAt: session.createdAt.toISOString(),
    }),
  );
});

async function loadVisibleSession(caller: User, id: number) {
  const [session] = await db
    .select()
    .from(trainingSessionsTable)
    .where(eq(trainingSessionsTable.id, id))
    .limit(1);
  if (!session) return null;
  if (
    !isHq(caller) &&
    session.villageId !== null &&
    session.villageId !== caller.villageId
  ) {
    return null;
  }
  return session;
}

router.post(
  "/trainings/:id/register",
  requireUser,
  async (req, res): Promise<void> => {
    const id = parseInt(String(req.params.id), 10);
    const caller = req.user!;
    const session = await loadVisibleSession(caller, id);
    if (!session) {
      res.status(404).json({ error: "Training session not found" });
      return;
    }
    if (session.status !== "scheduled") {
      res.status(400).json({ error: "Registration is closed for this session" });
      return;
    }
    // Member Development is restricted to vetted, dues-current members.
    if (caller.vettingStatus !== "vetted") {
      res.status(403).json({
        error:
          "Only vetted members may register for training sessions. Contact your coordinator to complete vetting.",
      });
      return;
    }
    const currentPeriod = new Date().toISOString().slice(0, 7); // yyyy-MM
    const [duesRecord] = await db
      .select({ id: duesPaymentsTable.id })
      .from(duesPaymentsTable)
      .where(
        and(
          eq(duesPaymentsTable.userId, caller.id),
          eq(duesPaymentsTable.period, currentPeriod),
        ),
      )
      .limit(1);
    if (!duesRecord) {
      res.status(403).json({
        error:
          "Only dues-current members may register for training sessions. Please pay your monthly dues first.",
      });
      return;
    }
    if (session.capacity !== null) {
      const [{ n }] = await db
        .select({ n: count() })
        .from(trainingRegistrationsTable)
        .where(eq(trainingRegistrationsTable.sessionId, id));
      if (n >= session.capacity) {
        res.status(400).json({ error: "This session is full" });
        return;
      }
    }
    try {
      const [reg] = await db
        .insert(trainingRegistrationsTable)
        .values({ sessionId: id, userId: caller.id })
        .returning();
      res.status(201).json(
        RegisterTrainingResponse.parse({
          ...reg,
          memberName: `${caller.firstName} ${caller.lastName}`,
          membershipCode: caller.membershipCode,
          completedAt: reg.completedAt?.toISOString() ?? null,
          createdAt: reg.createdAt.toISOString(),
        }),
      );
    } catch {
      res.status(409).json({ error: "You are already registered" });
    }
  },
);

// HQ anywhere; village executive (head/secretary/treasurer) for sessions
// scoped to their own village. Secretary is the record-keeping role but the
// full executive may verify.
function canManageSession(
  caller: User,
  session: { villageId: number | null },
): boolean {
  if (isHq(caller)) return true;
  return (
    EXECUTIVE_ROLES.includes(caller.role) &&
    session.villageId !== null &&
    session.villageId === caller.villageId
  );
}

router.get(
  "/trainings/:id/registrants",
  requireRole("village_head", "secretary", "treasurer", "assistant", "founder"),
  async (req, res): Promise<void> => {
    const id = parseInt(String(req.params.id), 10);
    const caller = req.user!;
    const session = await loadVisibleSession(caller, id);
    if (!session || !canManageSession(caller, session)) {
      res.status(404).json({ error: "Training session not found" });
      return;
    }
    const regs = await db
      .select({
        reg: trainingRegistrationsTable,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        membershipCode: usersTable.membershipCode,
      })
      .from(trainingRegistrationsTable)
      .innerJoin(usersTable, eq(trainingRegistrationsTable.userId, usersTable.id))
      .where(eq(trainingRegistrationsTable.sessionId, id));
    res.json(
      ListTrainingRegistrantsResponse.parse(
        regs.map(({ reg, firstName, lastName, membershipCode }) => ({
          ...reg,
          memberName: `${firstName} ${lastName}`,
          membershipCode,
          completedAt: reg.completedAt?.toISOString() ?? null,
          createdAt: reg.createdAt.toISOString(),
        })),
      ),
    );
  },
);

router.post(
  "/trainings/:id/progress",
  requireRole("village_head", "secretary", "treasurer", "assistant", "founder"),
  async (req, res): Promise<void> => {
    const id = parseInt(String(req.params.id), 10);
    const parsed = UpdateTrainingProgressBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const caller = req.user!;
    const session = await loadVisibleSession(caller, id);
    if (!session || !canManageSession(caller, session)) {
      res.status(404).json({ error: "Training session not found" });
      return;
    }
    const { userIds, status } = parsed.data;
    const updated = await db
      .update(trainingRegistrationsTable)
      .set({
        status,
        completedAt: status === "completed" ? new Date() : null,
      })
      .where(
        and(
          eq(trainingRegistrationsTable.sessionId, id),
          inArray(trainingRegistrationsTable.userId, userIds),
        ),
      )
      .returning({ id: trainingRegistrationsTable.id });
    res.json(UpdateTrainingProgressResponse.parse({ updated: updated.length }));
  },
);

export default router;

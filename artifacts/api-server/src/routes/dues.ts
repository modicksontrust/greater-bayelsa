import { Router, type IRouter } from "express";
import { and, eq, desc, inArray, type SQL } from "drizzle-orm";
import {
  db,
  duesPaymentsTable,
  usersTable,
  villagesTable,
  unitsTable,
  notificationsTable,
} from "@workspace/db";
import {
  GetMyDuesResponse,
  GetDuesStatusQueryParams,
  GetDuesStatusResponse,
  GetDuesRollupResponse,
  RecordBulkDuesBody,
  RecordBulkDuesResponse,
  SendDuesRemindersBody,
  SendDuesRemindersResponse,
} from "@workspace/api-zod";
import {
  requireUser,
  requireRole,
  requireHq,
  isHq,
} from "../middlewares/auth";
import { scopeCondition } from "./members";

const router: IRouter = Router();

const currentPeriod = () => new Date().toISOString().slice(0, 7);

router.get("/dues/me", requireUser, async (req, res): Promise<void> => {
  const payments = await db
    .select()
    .from(duesPaymentsTable)
    .where(eq(duesPaymentsTable.userId, req.user!.id))
    .orderBy(desc(duesPaymentsTable.period));
  const period = currentPeriod();
  res.json(
    GetMyDuesResponse.parse({
      current: { period, paid: payments.some((p) => p.period === period) },
      payments: payments.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      })),
    }),
  );
});

router.get("/dues/status", requireUser, async (req, res): Promise<void> => {
  const parsed = GetDuesStatusQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { period, villageId, unitId } = parsed.data;
  const conds: SQL[] = [eq(usersTable.status, "active")];
  const scope = scopeCondition(req.user!);
  if (scope) conds.push(scope);
  if (villageId !== undefined) conds.push(eq(usersTable.villageId, villageId));
  if (unitId !== undefined) conds.push(eq(usersTable.unitId, unitId));
  const members = await db
    .select({
      userId: usersTable.id,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      membershipCode: usersTable.membershipCode,
      unitId: usersTable.unitId,
      villageId: usersTable.villageId,
    })
    .from(usersTable)
    .where(and(...conds))
    .orderBy(usersTable.lastName);
  const paid = members.length
    ? await db
        .select()
        .from(duesPaymentsTable)
        .where(
          and(
            eq(duesPaymentsTable.period, period),
            inArray(
              duesPaymentsTable.userId,
              members.map((m) => m.userId),
            ),
          ),
        )
    : [];
  res.json(
    GetDuesStatusResponse.parse(
      members.map((m) => {
        const p = paid.find((x) => x.userId === m.userId);
        return { ...m, paid: !!p, method: p?.method ?? null };
      }),
    ),
  );
});

router.get("/dues/rollup", requireUser, async (req, res): Promise<void> => {
  const period = String(req.query.period ?? currentPeriod());
  const user = req.user!;
  const conds: SQL[] = [eq(usersTable.status, "active")];
  const scope = scopeCondition(user);
  if (scope) conds.push(scope);
  const members = await db
    .select({
      userId: usersTable.id,
      villageId: usersTable.villageId,
      unitId: usersTable.unitId,
    })
    .from(usersTable)
    .where(and(...conds));
  const paid = members.length
    ? await db
        .select({ userId: duesPaymentsTable.userId })
        .from(duesPaymentsTable)
        .where(
          and(
            eq(duesPaymentsTable.period, period),
            inArray(
              duesPaymentsTable.userId,
              members.map((m) => m.userId),
            ),
          ),
        )
    : [];
  const paidSet = new Set(paid.map((p) => p.userId));
  const villages = await db.select().from(villagesTable);
  const units = await db.select().from(unitsTable);

  const rows: Array<{
    villageId: number;
    villageName: string;
    unitId: number | null;
    unitName: string | null;
    paidCount: number;
    totalCount: number;
  }> = [];
  for (const v of villages) {
    const vm = members.filter((m) => m.villageId === v.id);
    if (!vm.length && !isHq(user)) continue;
    rows.push({
      villageId: v.id,
      villageName: v.name,
      unitId: null,
      unitName: null,
      paidCount: vm.filter((m) => paidSet.has(m.userId)).length,
      totalCount: vm.length,
    });
    for (const u of units.filter((x) => x.villageId === v.id)) {
      const um = vm.filter((m) => m.unitId === u.id);
      if (!um.length) continue;
      rows.push({
        villageId: v.id,
        villageName: v.name,
        unitId: u.id,
        unitName: u.name,
        paidCount: um.filter((m) => paidSet.has(m.userId)).length,
        totalCount: um.length,
      });
    }
  }
  res.json(GetDuesRollupResponse.parse(rows));
});

// Financial recording is a treasurer permission at village level (per the
// three-person executive model); HQ retains oversight access.
router.post(
  "/dues/bulk",
  requireRole("treasurer", "assistant", "founder"),
  async (req, res): Promise<void> => {
    const parsed = RecordBulkDuesBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { userIds, period, reference, receiptUrl } = parsed.data;
    const caller = req.user!;
    const scope = scopeCondition(caller);
    const targets = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(
        scope
          ? and(inArray(usersTable.id, userIds), scope)
          : inArray(usersTable.id, userIds),
      );
    if (targets.length !== userIds.length) {
      res
        .status(403)
        .json({ error: "Some members are outside your unit or village" });
      return;
    }
    const existing = await db
      .select({ userId: duesPaymentsTable.userId })
      .from(duesPaymentsTable)
      .where(
        and(
          eq(duesPaymentsTable.period, period),
          inArray(duesPaymentsTable.userId, userIds),
        ),
      );
    const alreadyPaid = new Set(existing.map((e) => e.userId));
    const toInsert = userIds.filter((id) => !alreadyPaid.has(id));
    if (toInsert.length) {
      await db.insert(duesPaymentsTable).values(
        toInsert.map((userId) => ({
          userId,
          period,
          method: "cash_bulk",
          reference,
          receiptUrl: receiptUrl ?? null,
          recordedById: caller.id,
        })),
      );
    }
    res.status(201).json(
      RecordBulkDuesResponse.parse({
        recorded: toInsert.length,
        alreadyPaid: alreadyPaid.size,
      }),
    );
  },
);

router.post("/dues/reminders", requireHq, async (req, res): Promise<void> => {
  const parsed = SendDuesRemindersBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { period } = parsed.data;
  const members = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.status, "active"));
  const paid = await db
    .select({ userId: duesPaymentsTable.userId })
    .from(duesPaymentsTable)
    .where(eq(duesPaymentsTable.period, period));
  const paidSet = new Set(paid.map((p) => p.userId));
  const overdue = members.filter((m) => !paidSet.has(m.id));
  if (overdue.length) {
    await db.insert(notificationsTable).values(
      overdue.map((m) => ({
        userId: m.id,
        title: "Monthly dues reminder",
        body: `Your ₦100 membership dues for ${period} are outstanding. Please pay digitally or through your unit leader.`,
        kind: "dues_reminder",
      })),
    );
  }
  res.json(SendDuesRemindersResponse.parse({ notified: overdue.length }));
});

export default router;

import { Router, type IRouter } from "express";
import { and, eq, isNull, count } from "drizzle-orm";
import {
  db,
  villagesTable,
  unitsTable,
  usersTable,
  leadershipTable,
} from "@workspace/db";
import {
  ListVillagesResponse,
  ListVillageUnitsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/villages", async (_req, res): Promise<void> => {
  const villages = await db.select().from(villagesTable).orderBy(villagesTable.id);
  const units = await db.select().from(unitsTable).orderBy(unitsTable.id);
  const counts = await db
    .select({ villageId: usersTable.villageId, n: count() })
    .from(usersTable)
    .where(eq(usersTable.status, "active"))
    .groupBy(usersTable.villageId);
  // Village heads with active tenure, exposed as public coordinators
  const heads = await db
    .select({
      villageId: leadershipTable.villageId,
      startDate: leadershipTable.startDate,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      bio: usersTable.bio,
      photoUrl: usersTable.photoUrl,
      credentials: usersTable.credentials,
      vettingStatus: usersTable.vettingStatus,
      whatsapp: usersTable.whatsapp,
    })
    .from(leadershipTable)
    .innerJoin(usersTable, eq(leadershipTable.userId, usersTable.id))
    .where(
      and(eq(leadershipTable.role, "village_head"), isNull(leadershipTable.endDate)),
    );

  const payload = villages.map((v) => {
    const head = heads.find((h) => h.villageId === v.id);
    return {
      id: v.id,
      name: v.name,
      description: v.description,
      // Group URLs are intentionally NOT exposed publicly — the WhatsApp
      // handoff is only released by the screening endpoint after verification.
      memberCount: counts.find((c) => c.villageId === v.id)?.n ?? 0,
      coordinator: head
        ? {
            firstName: head.firstName,
            lastName: head.lastName,
            bio: head.bio,
            photoUrl: head.photoUrl,
            credentials: head.credentials,
            vettingStatus: head.vettingStatus,
            whatsapp: head.whatsapp,
            tenureSince: head.startDate,
          }
        : null,
      units: units
        .filter((u) => u.villageId === v.id)
        .map((u) => ({ id: u.id, villageId: u.villageId, name: u.name })),
    };
  });
  res.json(ListVillagesResponse.parse(payload));
});

router.get("/villages/:id/units", async (req, res): Promise<void> => {
  const villageId = Number(req.params.id);
  const units = await db
    .select()
    .from(unitsTable)
    .where(eq(unitsTable.villageId, villageId))
    .orderBy(unitsTable.id);
  res.json(
    ListVillageUnitsResponse.parse(
      units.map((u) => ({ id: u.id, villageId: u.villageId, name: u.name })),
    ),
  );
});

export default router;

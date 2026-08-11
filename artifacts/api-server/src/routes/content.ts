import { Router, type IRouter } from "express";
import { and, eq, desc, inArray, isNull, or, type SQL } from "drizzle-orm";
import {
  db,
  postsTable,
  communityUpdatesTable,
  notificationsTable,
  feedbackReportsTable,
  usersTable,
  villagesTable,
} from "@workspace/db";
import {
  ListPostsResponse,
  CreatePostBody,
  CreatePostResponse,
  GetPostResponse,
  UpdatePostBody,
  UpdatePostResponse,
  ListUpdatesResponse,
  CreateUpdateBody,
  CreateUpdateResponse,
  ListNotificationsResponse,
  MarkNotificationReadResponse,
  SendMessageBody,
  SendMessageResponse,
  ListFeedbackResponse,
  SubmitFeedbackBody,
  SubmitFeedbackResponse,
  UpdateFeedbackBody,
  UpdateFeedbackResponse,
} from "@workspace/api-zod";
import {
  requireUser,
  requireHq,
  requireRole,
  isHq,
  isCoordinator,
} from "../middlewares/auth";

const router: IRouter = Router();

// ---------- Public posts ----------
router.get("/posts", async (req, res): Promise<void> => {
  const conds: SQL[] = [];
  if (req.query.category)
    conds.push(eq(postsTable.category, String(req.query.category)));
  const rows = await db
    .select()
    .from(postsTable)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(postsTable.createdAt))
    .limit(100);
  res.json(
    ListPostsResponse.parse(
      rows.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
    ),
  );
});

router.post("/posts", requireHq, async (req, res): Promise<void> => {
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db.insert(postsTable).values(parsed.data).returning();
  res.status(201).json(
    CreatePostResponse.parse({
      ...created,
      createdAt: created.createdAt.toISOString(),
    }),
  );
});

router.get("/posts/:id", async (req, res): Promise<void> => {
  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, Number(req.params.id)))
    .limit(1);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(
    GetPostResponse.parse({ ...post, createdAt: post.createdAt.toISOString() }),
  );
});

router.patch("/posts/:id", requireHq, async (req, res): Promise<void> => {
  const parsed = UpdatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(postsTable)
    .set(parsed.data)
    .where(eq(postsTable.id, Number(req.params.id)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(
    UpdatePostResponse.parse({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    }),
  );
});

router.delete("/posts/:id", requireHq, async (req, res): Promise<void> => {
  const deleted = await db
    .delete(postsTable)
    .where(eq(postsTable.id, Number(req.params.id)))
    .returning();
  if (!deleted.length) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.status(204).end();
});

// ---------- Community updates (urgent first) ----------
router.get("/updates", requireUser, async (req, res): Promise<void> => {
  const user = req.user!;
  const conds: SQL[] = [];
  if (!isHq(user)) {
    conds.push(
      or(
        isNull(communityUpdatesTable.villageId),
        eq(communityUpdatesTable.villageId, user.villageId ?? -1),
      )!,
    );
  }
  const rows = await db
    .select({
      u: communityUpdatesTable,
      villageName: villagesTable.name,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
    })
    .from(communityUpdatesTable)
    .leftJoin(villagesTable, eq(communityUpdatesTable.villageId, villagesTable.id))
    .innerJoin(usersTable, eq(communityUpdatesTable.authorId, usersTable.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(communityUpdatesTable.urgent), desc(communityUpdatesTable.createdAt))
    .limit(200);
  res.json(
    ListUpdatesResponse.parse(
      rows.map((r) => ({
        ...r.u,
        villageName: r.villageName,
        authorName: `${r.firstName} ${r.lastName}`,
        createdAt: r.u.createdAt.toISOString(),
      })),
    ),
  );
});

router.post(
  "/updates",
  requireRole("unit_leader", "village_head", "secretary", "assistant", "founder"),
  async (req, res): Promise<void> => {
    const parsed = CreateUpdateBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const caller = req.user!;
    const villageId = isHq(caller)
      ? (parsed.data.villageId ?? null)
      : caller.villageId;
    const [created] = await db
      .insert(communityUpdatesTable)
      .values({
        villageId,
        authorId: caller.id,
        title: parsed.data.title,
        body: parsed.data.body,
        urgent: parsed.data.urgent ?? false,
      })
      .returning();
    res.status(201).json(
      CreateUpdateResponse.parse({
        ...created,
        villageName: null,
        authorName: `${caller.firstName} ${caller.lastName}`,
        createdAt: created.createdAt.toISOString(),
      }),
    );
  },
);

// ---------- Notifications / messaging ----------
router.get("/notifications", requireUser, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.user!.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(100);
  res.json(
    ListNotificationsResponse.parse(
      rows.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() })),
    ),
  );
});

router.post(
  "/notifications/:id/read",
  requireUser,
  async (req, res): Promise<void> => {
    const [updated] = await db
      .update(notificationsTable)
      .set({ read: true })
      .where(
        and(
          eq(notificationsTable.id, Number(req.params.id)),
          eq(notificationsTable.userId, req.user!.id),
        ),
      )
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.json(
      MarkNotificationReadResponse.parse({
        ...updated,
        createdAt: updated.createdAt.toISOString(),
      }),
    );
  },
);

router.post("/messages", requireHq, async (req, res): Promise<void> => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { title, body, userIds, villageId } = parsed.data;
  const conds: SQL[] = [eq(usersTable.status, "active")];
  if (userIds && userIds.length) conds.push(inArray(usersTable.id, userIds));
  if (villageId != null) conds.push(eq(usersTable.villageId, villageId));
  const recipients = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(and(...conds));
  if (recipients.length) {
    await db.insert(notificationsTable).values(
      recipients.map((r) => ({
        userId: r.id,
        title,
        body,
        kind: "broadcast",
      })),
    );
  }
  res.status(201).json(SendMessageResponse.parse({ notified: recipients.length }));
});

// ---------- Feedback (member -> HQ, bypasses local leadership) ----------
router.get("/feedback", requireUser, async (req, res): Promise<void> => {
  const user = req.user!;
  const conds: SQL[] = [];
  if (!isHq(user)) conds.push(eq(feedbackReportsTable.userId, user.id));
  const rows = await db
    .select({
      f: feedbackReportsTable,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
      membershipCode: usersTable.membershipCode,
      villageName: villagesTable.name,
    })
    .from(feedbackReportsTable)
    .innerJoin(usersTable, eq(feedbackReportsTable.userId, usersTable.id))
    .leftJoin(villagesTable, eq(usersTable.villageId, villagesTable.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(feedbackReportsTable.createdAt))
    .limit(200);
  res.json(
    ListFeedbackResponse.parse(
      rows.map((r) => ({
        ...r.f,
        memberName: `${r.firstName} ${r.lastName}`,
        membershipCode: r.membershipCode,
        villageName: r.villageName,
        createdAt: r.f.createdAt.toISOString(),
      })),
    ),
  );
});

router.post("/feedback", requireUser, async (req, res): Promise<void> => {
  const parsed = SubmitFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db
    .insert(feedbackReportsTable)
    .values({
      userId: req.user!.id,
      category: parsed.data.category,
      body: parsed.data.body,
    })
    .returning();
  res.status(201).json(
    SubmitFeedbackResponse.parse({
      ...created,
      createdAt: created.createdAt.toISOString(),
    }),
  );
});

router.patch("/feedback/:id", requireHq, async (req, res): Promise<void> => {
  const parsed = UpdateFeedbackBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(feedbackReportsTable)
    .set({
      status: parsed.data.status,
      response: parsed.data.response ?? undefined,
      respondedById: req.user!.id,
    })
    .where(eq(feedbackReportsTable.id, Number(req.params.id)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(
    UpdateFeedbackResponse.parse({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    }),
  );
});

void isCoordinator;
export default router;

import { Router, type IRouter } from "express";
import { and, eq, desc, or, isNull, asc } from "drizzle-orm";
import {
  db,
  postsTable,
  eventsTable,
  notificationsTable,
  membersTable,
  type Post,
  type EventRow,
  type NotificationRow,
} from "@workspace/db";
import {
  ListPostsQueryParams,
  ListPostsResponse,
  CreatePostBody,
  CreatePostResponse,
  GetPostParams,
  GetPostResponse,
  UpdatePostParams,
  UpdatePostBody,
  UpdatePostResponse,
  DeletePostParams,
  ListEventsResponse,
  CreateEventBody,
  CreateEventResponse,
  DeleteEventParams,
  ListNotificationsResponse,
  SendNotificationBody,
  SendNotificationResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
} from "@workspace/api-zod";
import { requireMember, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const serializePost = (p: Post) => ({
  ...p,
  createdAt: p.createdAt.toISOString(),
});
const serializeEvent = (e: EventRow) => ({
  ...e,
  startsAt: e.startsAt.toISOString(),
  createdAt: e.createdAt.toISOString(),
});
const serializeNotification = (n: NotificationRow) => ({
  id: n.id,
  title: n.title,
  body: n.body,
  broadcast: n.memberId === null,
  read: n.read,
  createdAt: n.createdAt.toISOString(),
});

// Posts (public read, admin write)
router.get("/posts", async (req, res): Promise<void> => {
  const parsed = ListPostsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category } = parsed.data;
  const posts = await db
    .select()
    .from(postsTable)
    .where(category ? eq(postsTable.category, category) : undefined)
    .orderBy(desc(postsTable.createdAt));
  res.json(ListPostsResponse.parse(posts.map(serializePost)));
});

router.get("/posts/:id", async (req, res): Promise<void> => {
  const parsed = GetPostParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [post] = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.id, parsed.data.id))
    .limit(1);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(GetPostResponse.parse(serializePost(post)));
});

router.post("/posts", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db.insert(postsTable).values(parsed.data).returning();
  res.status(201).json(CreatePostResponse.parse(serializePost(created)));
});

router.patch("/posts/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdatePostParams.safeParse(req.params);
  const body = UpdatePostBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({
      error: params.success ? body.error?.message : params.error.message,
    });
    return;
  }
  const [updated] = await db
    .update(postsTable)
    .set(body.data)
    .where(eq(postsTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(UpdatePostResponse.parse(serializePost(updated)));
});

router.delete("/posts/:id", requireAdmin, async (req, res): Promise<void> => {
  const parsed = DeletePostParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const deleted = await db
    .delete(postsTable)
    .where(eq(postsTable.id, parsed.data.id))
    .returning();
  if (!deleted.length) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.status(204).send();
});

// Events (public read, admin write)
router.get("/events", async (_req, res): Promise<void> => {
  const events = await db
    .select()
    .from(eventsTable)
    .orderBy(asc(eventsTable.startsAt));
  res.json(ListEventsResponse.parse(events.map(serializeEvent)));
});

router.post("/events", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db
    .insert(eventsTable)
    .values({ ...parsed.data, startsAt: new Date(parsed.data.startsAt) })
    .returning();
  res.status(201).json(CreateEventResponse.parse(serializeEvent(created)));
});

router.delete("/events/:id", requireAdmin, async (req, res): Promise<void> => {
  const parsed = DeleteEventParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const deleted = await db
    .delete(eventsTable)
    .where(eq(eventsTable.id, parsed.data.id))
    .returning();
  if (!deleted.length) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  res.status(204).send();
});

// Notifications
router.get("/notifications", requireMember, async (req, res): Promise<void> => {
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(
      or(
        eq(notificationsTable.memberId, req.member!.id),
        isNull(notificationsTable.memberId),
      ),
    )
    .orderBy(desc(notificationsTable.createdAt));
  res.json(
    ListNotificationsResponse.parse(notifications.map(serializeNotification)),
  );
});

router.post("/notifications", requireAdmin, async (req, res): Promise<void> => {
  const parsed = SendNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { title, body, memberId } = parsed.data;
  if (memberId != null) {
    const [target] = await db
      .select({ id: membersTable.id })
      .from(membersTable)
      .where(eq(membersTable.id, memberId))
      .limit(1);
    if (!target) {
      res.status(400).json({ error: "Target member not found" });
      return;
    }
  }
  const [created] = await db
    .insert(notificationsTable)
    .values({ title, body, memberId: memberId ?? null })
    .returning();
  res
    .status(201)
    .json(SendNotificationResponse.parse(serializeNotification(created)));
});

router.post(
  "/notifications/:id/read",
  requireMember,
  async (req, res): Promise<void> => {
    const parsed = MarkNotificationReadParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [updated] = await db
      .update(notificationsTable)
      .set({ read: true })
      .where(
        and(
          eq(notificationsTable.id, parsed.data.id),
          eq(notificationsTable.memberId, req.member!.id),
        ),
      )
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.json(MarkNotificationReadResponse.parse(serializeNotification(updated)));
  },
);

export default router;

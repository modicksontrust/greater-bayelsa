import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { villagesTable } from "./geography";

// Public news / impact stories / growth opportunities
export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull().default("news"), // news | impact | development | testimonial
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Community updates feed (internal, cross-village, urgent-first)
export const communityUpdatesTable = pgTable("community_updates", {
  id: serial("id").primaryKey(),
  villageId: integer("village_id").references(() => villagesTable.id), // null = org-wide
  authorId: integer("author_id")
    .notNull()
    .references(() => usersTable.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  urgent: boolean("urgent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Per-recipient notifications (broadcasts fan out one row per member)
export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  kind: text("kind").notNull().default("general"), // general | dues_reminder | broadcast
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Direct member-to-HQ feedback (bypasses local leadership; never anonymous)
export const feedbackReportsTable = pgTable("feedback_reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  category: text("category").notNull(), // leadership_concern | security_issue | dues_dispute | other
  body: text("body").notNull(),
  status: text("status").notNull().default("open"), // open | reviewed | resolved
  response: text("response"),
  respondedById: integer("responded_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Post = typeof postsTable.$inferSelect;
export type CommunityUpdate = typeof communityUpdatesTable.$inferSelect;
export type NotificationRow = typeof notificationsTable.$inferSelect;
export type FeedbackReport = typeof feedbackReportsTable.$inferSelect;

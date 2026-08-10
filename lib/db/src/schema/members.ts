import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

export const membersTable = pgTable("members", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  membershipCode: text("membership_code").notNull().unique(),
  voterId: integer("voter_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  vin: text("vin").notNull(),
  gender: text("gender"),
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  occupation: text("occupation"),
  address: text("address"),
  photoUrl: text("photo_url"),
  lga: text("lga").notNull(),
  ward: text("ward").notNull(),
  pollingUnit: text("polling_unit").notNull(),
  membershipCategory: text("membership_category").notNull().default("full_time"),
  role: text("role").notNull().default("member"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const postsTable = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull().default("news"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Member = typeof membersTable.$inferSelect;
export type Post = typeof postsTable.$inferSelect;
export type EventRow = typeof eventsTable.$inferSelect;
export type NotificationRow = typeof notificationsTable.$inferSelect;

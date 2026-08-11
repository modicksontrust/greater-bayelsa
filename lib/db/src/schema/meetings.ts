import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  date,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { villagesTable, unitsTable } from "./geography";
import { usersTable } from "./users";

// Monthly village-level meeting record submitted by the village head.
export const meetingsTable = pgTable("meetings", {
  id: serial("id").primaryKey(),
  villageId: integer("village_id")
    .notNull()
    .references(() => villagesTable.id),
  heldOn: date("held_on", { mode: "string" }).notNull(),
  attendanceCount: integer("attendance_count").notNull(),
  // Optional per-unit breakdown: [{ unitId, count }]
  unitBreakdown: jsonb("unit_breakdown").$type<
    Array<{ unitId: number; count: number }>
  >(),
  discussionPoints: text("discussion_points").notNull(),
  submittedById: integer("submitted_by_id")
    .notNull()
    .references(() => usersTable.id),
  // Random token embedded in the QR code for self-check-in
  checkinCode: text("checkin_code").notNull().unique(),
  status: text("status").notNull().default("submitted"), // draft | submitted
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Evidence: min 5 photos + 1 video (>= 2 min) enforced at submission
export const meetingMediaTable = pgTable("meeting_media", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id")
    .notNull()
    .references(() => meetingsTable.id),
  kind: text("kind").notNull(), // photo | video
  objectPath: text("object_path").notNull(),
  durationSeconds: integer("duration_seconds"), // videos only
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Distinct requests-to-HQ workflow (not buried in notes)
export const hqRequestsTable = pgTable("hq_requests", {
  id: serial("id").primaryKey(),
  meetingId: integer("meeting_id").references(() => meetingsTable.id),
  villageId: integer("village_id")
    .notNull()
    .references(() => villagesTable.id),
  submittedById: integer("submitted_by_id")
    .notNull()
    .references(() => usersTable.id),
  body: text("body").notNull(),
  status: text("status").notNull().default("open"), // open | responded | resolved
  response: text("response"),
  respondedById: integer("responded_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Unified member-verified attendance record, tagged by method
export const attendanceRecordsTable = pgTable(
  "attendance_records",
  {
    id: serial("id").primaryKey(),
    meetingId: integer("meeting_id")
      .notNull()
      .references(() => meetingsTable.id),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id),
    method: text("method").notNull(), // qr | video
    videoObjectPath: text("video_object_path"), // video-fallback clip
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("attendance_meeting_user_unique").on(t.meetingId, t.userId)],
);

// Calendar: org-wide fixed dates (HQ only) + local events
export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  scope: text("scope").notNull().default("org"), // org | village | unit
  villageId: integer("village_id").references(() => villagesTable.id),
  unitId: integer("unit_id").references(() => unitsTable.id),
  createdById: integer("created_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Meeting = typeof meetingsTable.$inferSelect;
export type MeetingMedia = typeof meetingMediaTable.$inferSelect;
export type HqRequest = typeof hqRequestsTable.$inferSelect;
export type AttendanceRecord = typeof attendanceRecordsTable.$inferSelect;
export type EventRow = typeof eventsTable.$inferSelect;

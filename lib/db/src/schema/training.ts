import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { villagesTable } from "./geography";
import { usersTable } from "./users";

// Annual training track (separate from monthly meetings per addendum).
export const trainingSessionsTable = pgTable("training_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  // Skill area recorded on the member's profile upon completion.
  skillArea: text("skill_area"),
  scheduledOn: date("scheduled_on", { mode: "string" }).notNull(),
  location: text("location"),
  // null = open to all villages (HQ-wide)
  villageId: integer("village_id").references(() => villagesTable.id),
  capacity: integer("capacity"),
  status: text("status").notNull().default("scheduled"), // scheduled | completed | cancelled
  createdById: integer("created_by_id")
    .notNull()
    .references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const trainingRegistrationsTable = pgTable(
  "training_registrations",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => trainingSessionsTable.id),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id),
    // registered -> attended -> completed
    status: text("status").notNull().default("registered"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("training_reg_session_user_idx").on(t.sessionId, t.userId)],
);

export type TrainingSession = typeof trainingSessionsTable.$inferSelect;
export type TrainingRegistration = typeof trainingRegistrationsTable.$inferSelect;

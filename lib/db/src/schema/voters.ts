import {
  pgTable,
  text,
  serial,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const votersTable = pgTable("voters", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  gender: text("gender").notNull(),
  phone: text("phone"),
  vin: text("vin"),
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  occupation: text("occupation"),
  lga: text("lga").notNull(),
  ward: text("ward").notNull(),
  pollingUnit: text("polling_unit").notNull(),
  supportLevel: text("support_level").notNull().default("unknown"),
  contactStatus: text("contact_status").notNull().default("not_contacted"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertVoterSchema = createInsertSchema(votersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertVoter = z.infer<typeof insertVoterSchema>;
export type Voter = typeof votersTable.$inferSelect;

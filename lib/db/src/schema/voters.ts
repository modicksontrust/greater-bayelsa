import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { villagesTable, unitsTable } from "./geography";

// Official constituency voter roll (INEC import), each voter pre-mapped
// to a village/unit for AI screening and enrollment cross-checks.
export const votersTable = pgTable("voters", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  gender: text("gender"),
  phone: text("phone"),
  vin: text("vin"),
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  occupation: text("occupation"),
  villageId: integer("village_id").references(() => villagesTable.id),
  unitId: integer("unit_id").references(() => unitsTable.id),
  pollingUnit: text("polling_unit"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Voter = typeof votersTable.$inferSelect;

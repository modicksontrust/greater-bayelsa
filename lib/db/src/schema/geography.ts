import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

// Full hierarchy exists now for statewide expansion later.
// Phase one only populates villages and units.
export const zonesTable = pgTable("zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const districtsTable = pgTable("districts", {
  id: serial("id").primaryKey(),
  zoneId: integer("zone_id").references(() => zonesTable.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const villagesTable = pgTable("villages", {
  id: serial("id").primaryKey(),
  districtId: integer("district_id").references(() => districtsTable.id),
  name: text("name").notNull().unique(),
  // Public "Register Now" presentation
  description: text("description"),
  whatsappGroupUrl: text("whatsapp_group_url"),
  telegramGroupUrl: text("telegram_group_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const unitsTable = pgTable("units", {
  id: serial("id").primaryKey(),
  villageId: integer("village_id")
    .notNull()
    .references(() => villagesTable.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Zone = typeof zonesTable.$inferSelect;
export type District = typeof districtsTable.$inferSelect;
export type Village = typeof villagesTable.$inferSelect;
export type Unit = typeof unitsTable.$inferSelect;

import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// One row per member per monthly period once paid.
// period format: "YYYY-MM". Amounts in kobo (₦100 = 10000).
export const duesPaymentsTable = pgTable(
  "dues_payments",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id),
    period: text("period").notNull(),
    amountKobo: integer("amount_kobo").notNull().default(10000),
    method: text("method").notNull(), // cash_bulk | digital
    // POS transaction reference for cash bulk payments; gateway ref for digital
    reference: text("reference"),
    receiptUrl: text("receipt_url"),
    // Unit leader who recorded a bulk cash payment (accountability)
    recordedById: integer("recorded_by_id").references(() => usersTable.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("dues_user_period_idx").on(t.userId, t.period)],
);

export type DuesPayment = typeof duesPaymentsTable.$inferSelect;

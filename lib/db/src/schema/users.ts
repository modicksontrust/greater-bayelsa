import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { villagesTable, unitsTable } from "./geography";
import { votersTable } from "./voters";

// Roles: member | unit_leader | village_head | secretary | treasurer | assistant | founder
// village_head, secretary, treasurer form the 3-person village executive.
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").unique(),
  membershipCode: text("membership_code").notNull().unique(),
  role: text("role").notNull().default("member"),
  status: text("status").notNull().default("active"), // active | inactive
  membershipCategory: text("membership_category")
    .notNull()
    .default("full_time"), // full_time | part_time
  joinDate: date("join_date", { mode: "string" }),

  // Identity
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  gender: text("gender"),
  dateOfBirth: date("date_of_birth", { mode: "string" }),
  phone: text("phone").notNull(),
  phone2: text("phone2"),
  phone3: text("phone3"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  photoUrl: text("photo_url"),
  vin: text("vin").notNull(),
  voterId: integer("voter_id").references(() => votersTable.id),

  // Profile
  stateOfOrigin: text("state_of_origin"),
  occupation: text("occupation"),
  address: text("address"),
  maritalStatus: text("marital_status"),
  nextOfKinName: text("next_of_kin_name"),
  nextOfKinPhone: text("next_of_kin_phone"),
  cvUrl: text("cv_url"),
  bio: text("bio"), // coordinator-written when no CV; also public leader bio

  // Bank details (for organisation payouts)
  bankName: text("bank_name"),
  bankAccountName: text("bank_account_name"),
  bankAccountNumber: text("bank_account_number"),

  // Leadership credentials (shown publicly for leaders)
  credentials: text("credentials"), // trainings completed etc.
  vettingStatus: text("vetting_status").notNull().default("not_vetted"), // not_vetted | in_progress | vetted

  // Placement
  villageId: integer("village_id").references(() => villagesTable.id),
  unitId: integer("unit_id").references(() => unitsTable.id),

  enrolledById: integer("enrolled_by_id"),

  // Induction pipeline
  inductionStatus: text("induction_status").notNull().default("not_started"), // not_started | pledge_submitted | inducted
  inductionVideoPath: text("induction_video_path"),
  inductionPhoto1Path: text("induction_photo1_path"),
  inductionPhoto2Path: text("induction_photo2_path"),
  inductedAt: timestamp("inducted_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Role-assignment layer with tenure (supports rotation)
export const leadershipTable = pgTable("leadership", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  role: text("role").notNull(), // unit_leader | village_head | secretary | treasurer | assistant | founder
  villageId: integer("village_id").references(() => villagesTable.id),
  unitId: integer("unit_id").references(() => unitsTable.id),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type Leadership = typeof leadershipTable.$inferSelect;

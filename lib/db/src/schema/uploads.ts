import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// Ownership record for every private object upload, created when the
// presigned URL is issued. Used to authorize reads of /objects/* paths.
export const uploadsTable = pgTable("uploads", {
  id: serial("id").primaryKey(),
  objectPath: text("object_path").notNull().unique(),
  // What the upload is for; drives read authorization.
  // profile_photo | cv | meeting_photo | meeting_video | attendance_video | receipt | general
  purpose: text("purpose").notNull().default("general"),
  // MIME type recorded at presign time for server-side validation of evidence.
  contentType: text("content_type"),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Upload = typeof uploadsTable.$inferSelect;

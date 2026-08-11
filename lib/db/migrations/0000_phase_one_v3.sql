CREATE TABLE "districts" (
	"id" serial PRIMARY KEY NOT NULL,
	"zone_id" integer,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "units" (
	"id" serial PRIMARY KEY NOT NULL,
	"village_id" integer NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "villages" (
	"id" serial PRIMARY KEY NOT NULL,
	"district_id" integer,
	"name" text NOT NULL,
	"description" text,
	"whatsapp_group_url" text,
	"telegram_group_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "villages_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "zones_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "voters" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"gender" text,
	"phone" text,
	"vin" text,
	"date_of_birth" date,
	"occupation" text,
	"village_id" integer,
	"unit_id" integer,
	"polling_unit" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leadership" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"role" text NOT NULL,
	"village_id" integer,
	"unit_id" integer,
	"start_date" date NOT NULL,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text,
	"membership_code" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"membership_category" text DEFAULT 'full_time' NOT NULL,
	"join_date" date,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"gender" text,
	"date_of_birth" date,
	"phone" text NOT NULL,
	"whatsapp" text,
	"email" text,
	"photo_url" text,
	"vin" text NOT NULL,
	"voter_id" integer,
	"occupation" text,
	"address" text,
	"marital_status" text,
	"next_of_kin_name" text,
	"next_of_kin_phone" text,
	"cv_url" text,
	"bio" text,
	"credentials" text,
	"vetting_status" text DEFAULT 'not_vetted' NOT NULL,
	"village_id" integer,
	"unit_id" integer,
	"enrolled_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id"),
	CONSTRAINT "users_membership_code_unique" UNIQUE("membership_code")
);
--> statement-breakpoint
CREATE TABLE "dues_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"period" text NOT NULL,
	"amount_kobo" integer DEFAULT 10000 NOT NULL,
	"method" text NOT NULL,
	"reference" text,
	"receipt_url" text,
	"recorded_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"method" text NOT NULL,
	"video_object_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_meeting_user_unique" UNIQUE("meeting_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"starts_at" timestamp with time zone NOT NULL,
	"scope" text DEFAULT 'org' NOT NULL,
	"village_id" integer,
	"unit_id" integer,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hq_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_id" integer,
	"village_id" integer NOT NULL,
	"submitted_by_id" integer NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"response" text,
	"responded_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"meeting_id" integer NOT NULL,
	"kind" text NOT NULL,
	"object_path" text NOT NULL,
	"duration_seconds" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"village_id" integer NOT NULL,
	"held_on" date NOT NULL,
	"attendance_count" integer NOT NULL,
	"unit_breakdown" jsonb,
	"discussion_points" text NOT NULL,
	"submitted_by_id" integer NOT NULL,
	"checkin_code" text NOT NULL,
	"status" text DEFAULT 'submitted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meetings_checkin_code_unique" UNIQUE("checkin_code")
);
--> statement-breakpoint
CREATE TABLE "community_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"village_id" integer,
	"author_id" integer NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"urgent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"category" text NOT NULL,
	"body" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"response" text,
	"responded_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"kind" text DEFAULT 'general' NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"category" text DEFAULT 'news' NOT NULL,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"object_path" text NOT NULL,
	"purpose" text DEFAULT 'general' NOT NULL,
	"content_type" text,
	"owner_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uploads_object_path_unique" UNIQUE("object_path")
);
--> statement-breakpoint
CREATE TABLE "training_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"status" text DEFAULT 'registered' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"skill_area" text,
	"scheduled_on" date NOT NULL,
	"location" text,
	"village_id" integer,
	"capacity" integer,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "villages" ADD CONSTRAINT "villages_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voters" ADD CONSTRAINT "voters_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voters" ADD CONSTRAINT "voters_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leadership" ADD CONSTRAINT "leadership_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leadership" ADD CONSTRAINT "leadership_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leadership" ADD CONSTRAINT "leadership_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_voter_id_voters_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."voters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dues_payments" ADD CONSTRAINT "dues_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dues_payments" ADD CONSTRAINT "dues_payments_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hq_requests" ADD CONSTRAINT "hq_requests_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hq_requests" ADD CONSTRAINT "hq_requests_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hq_requests" ADD CONSTRAINT "hq_requests_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hq_requests" ADD CONSTRAINT "hq_requests_responded_by_id_users_id_fk" FOREIGN KEY ("responded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_media" ADD CONSTRAINT "meeting_media_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_updates" ADD CONSTRAINT "community_updates_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_updates" ADD CONSTRAINT "community_updates_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD CONSTRAINT "feedback_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD CONSTRAINT "feedback_reports_responded_by_id_users_id_fk" FOREIGN KEY ("responded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_registrations" ADD CONSTRAINT "training_registrations_session_id_training_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_registrations" ADD CONSTRAINT "training_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_village_id_villages_id_fk" FOREIGN KEY ("village_id") REFERENCES "public"."villages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dues_user_period_idx" ON "dues_payments" USING btree ("user_id","period");--> statement-breakpoint
CREATE UNIQUE INDEX "training_reg_session_user_idx" ON "training_registrations" USING btree ("session_id","user_id");
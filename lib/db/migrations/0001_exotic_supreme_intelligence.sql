ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone2" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone3" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "state_of_origin" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bank_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bank_account_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bank_account_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "induction_status" text DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "induction_video_path" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "induction_photo1_path" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "induction_photo2_path" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "inducted_at" timestamp with time zone;

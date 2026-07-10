CREATE TABLE "schedule_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"frequency" integer DEFAULT 1 NOT NULL,
	"primary_time" text DEFAULT '09:00' NOT NULL,
	"secondary_time" text DEFAULT '21:00',
	"timezone" text DEFAULT 'Asia/Bangkok' NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_run_slot" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

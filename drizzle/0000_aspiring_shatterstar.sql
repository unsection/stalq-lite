CREATE TYPE "public"."scrape_status" AS ENUM('success', 'error', 'timeout', 'no_price');--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"domain" text NOT NULL,
	"current_price" numeric(12, 2),
	"currency" text DEFAULT 'USD',
	"use_main_content_only" boolean DEFAULT false NOT NULL,
	"settle_animations" boolean DEFAULT false NOT NULL,
	"include_selectors" text[] DEFAULT '{}' NOT NULL,
	"exclude_selectors" text[] DEFAULT '{}' NOT NULL,
	"country" text,
	"wait_for_ms" integer,
	"timeout_enabled" boolean DEFAULT false NOT NULL,
	"timeout_ms" integer,
	"last_scraped_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scrape_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"status" "scrape_status" NOT NULL,
	"price" numeric(12, 2),
	"currency" text,
	"duration_ms" integer,
	"credits_consumed" integer,
	"error_message" text,
	"finish_reason" text,
	"country" text,
	"wait_for_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scrape_logs" ADD CONSTRAINT "scrape_logs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "scrape_logs" DROP COLUMN IF EXISTS "raw_html";
--> statement-breakpoint
ALTER TABLE "scrape_logs" ADD COLUMN "scrape_response" jsonb;

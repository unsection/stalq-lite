ALTER TABLE "own_products" ADD COLUMN "cost_per_unit" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "own_products" ADD COLUMN "marketplace_fee_percent" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "own_products" ADD COLUMN "shipping_cost_per_unit" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "own_products" ADD COLUMN "target_margin_percent" numeric(5, 2) DEFAULT '20' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "own_product_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_own_product_id_own_products_id_fk" FOREIGN KEY ("own_product_id") REFERENCES "public"."own_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
UPDATE "products"
SET "own_product_id" = (SELECT "id" FROM "own_products" ORDER BY "created_at" ASC LIMIT 1)
WHERE "own_product_id" IS NULL
  AND (SELECT COUNT(*) FROM "own_products") = 1;

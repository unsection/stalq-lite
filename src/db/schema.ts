import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const scrapeStatusEnum = pgEnum("scrape_status", [
  "success",
  "error",
  "timeout",
  "no_price",
]);

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  domain: text("domain").notNull(),
  currentPrice: numeric("current_price", { precision: 12, scale: 2 }),
  currency: text("currency").default("USD"),
  useMainContentOnly: boolean("use_main_content_only").notNull().default(false),
  settleAnimations: boolean("settle_animations").notNull().default(false),
  includeSelectors: text("include_selectors").array().notNull().default([]),
  excludeSelectors: text("exclude_selectors").array().notNull().default([]),
  country: text("country"),
  waitForMs: integer("wait_for_ms"),
  timeoutEnabled: boolean("timeout_enabled").notNull().default(false),
  timeoutMs: integer("timeout_ms"),
  lastScrapedAt: timestamp("last_scraped_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const priceHistory = pgTable("price_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  scrapedAt: timestamp("scraped_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scrapeLogs = pgTable("scrape_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  status: scrapeStatusEnum("status").notNull(),
  price: numeric("price", { precision: 12, scale: 2 }),
  currency: text("currency"),
  durationMs: integer("duration_ms"),
  creditsConsumed: integer("credits_consumed"),
  errorMessage: text("error_message"),
  finishReason: text("finish_reason"),
  country: text("country"),
  waitForMs: integer("wait_for_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ownProducts = pgTable("own_products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  sku: text("sku"),
  url: text("url"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scheduleSettings = pgTable("schedule_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  frequency: integer("frequency").notNull().default(1),
  primaryTime: text("primary_time").notNull().default("09:00"),
  secondaryTime: text("secondary_time").default("21:00"),
  timezone: text("timezone").notNull().default("Asia/Bangkok"),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastRunSlot: text("last_run_slot"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type PriceHistoryRow = typeof priceHistory.$inferSelect;
export type ScrapeLog = typeof scrapeLogs.$inferSelect;
export type ScheduleSettings = typeof scheduleSettings.$inferSelect;
export type NewScheduleSettings = typeof scheduleSettings.$inferInsert;
export type OwnProduct = typeof ownProducts.$inferSelect;
export type NewOwnProduct = typeof ownProducts.$inferInsert;

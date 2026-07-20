import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, scrapeLogs } from "@/db/schema";
import type { DateRange } from "@/lib/constants";
import { getRangeStart } from "@/lib/dates";

const parseRange = (value: string | null): DateRange => {
  if (value === "7d" || value === "30d" || value === "90d") return value;
  return "30d";
};

const parseTab = (value: string | null) => {
  if (value === "price_changes" || value === "errors") return value;
  return "scrapes";
};

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const range = parseRange(searchParams.get("range"));
  const tab = parseTab(searchParams.get("tab"));
  const productId = searchParams.get("productId");
  const since = getRangeStart(range);

  const conditions = [gte(scrapeLogs.createdAt, since)];

  if (productId) {
    conditions.push(eq(scrapeLogs.productId, productId));
  }

  if (tab === "price_changes") {
    conditions.push(eq(scrapeLogs.status, "success"));
  }

  if (tab === "errors") {
    conditions.push(inArray(scrapeLogs.status, ["error", "timeout", "no_price"]));
  }

  const rows = await db
    .select({
      id: scrapeLogs.id,
      productId: scrapeLogs.productId,
      status: scrapeLogs.status,
      price: scrapeLogs.price,
      currency: scrapeLogs.currency,
      durationMs: scrapeLogs.durationMs,
      creditsConsumed: scrapeLogs.creditsConsumed,
      errorMessage: scrapeLogs.errorMessage,
      finishReason: scrapeLogs.finishReason,
      country: scrapeLogs.country,
      waitForMs: scrapeLogs.waitForMs,
      createdAt: scrapeLogs.createdAt,
      hasScrapeResponse: sql<boolean>`${scrapeLogs.scrapeResponse} is not null`,
      productName: products.name,
      productDomain: products.domain,
      productUrl: products.url,
    })
    .from(scrapeLogs)
    .innerJoin(products, eq(scrapeLogs.productId, products.id))
    .where(and(...conditions))
    .orderBy(desc(scrapeLogs.createdAt))
    .limit(200);

  return NextResponse.json({
    range,
    tab,
    logs: rows.map((row) => ({
      ...row,
      hasScrapeResponse: Boolean(row.hasScrapeResponse),
    })),
  });
};

import { Suspense } from "react";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { products, scrapeLogs } from "@/db/schema";
import { LogsPageClient } from "@/components/logs/LogsPageClient";
import type { DateRange } from "@/lib/constants";
import { getRangeStart } from "@/lib/dates";

export const dynamic = "force-dynamic";

type LogsPageProps = {
  searchParams: Promise<{
    range?: string;
    tab?: string;
    productId?: string;
  }>;
};

const parseRange = (value?: string): DateRange => {
  if (value === "7d" || value === "30d" || value === "90d") return value;
  return "30d";
};

const parseTab = (value?: string) => {
  if (value === "price_changes" || value === "errors") return value;
  return "scrapes";
};

const LogsPageContent = async ({ searchParams }: LogsPageProps) => {
  const params = await searchParams;
  const range = parseRange(params.range);
  const tab = parseTab(params.tab);
  const productId = params.productId;
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

  const logs = await db
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

  const seriesConditions = [gte(scrapeLogs.createdAt, since)];
  if (productId) {
    seriesConditions.push(eq(scrapeLogs.productId, productId));
  }

  const seriesData = await db
    .select({
      bucket: sql<string>`to_char(date_trunc('day', ${scrapeLogs.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(scrapeLogs)
    .where(and(...seriesConditions))
    .groupBy(sql`date_trunc('day', ${scrapeLogs.createdAt})`)
    .orderBy(sql`date_trunc('day', ${scrapeLogs.createdAt})`);

  return (
    <LogsPageClient
      logs={logs.map((row) => ({
        ...row,
        hasScrapeResponse: Boolean(row.hasScrapeResponse),
      }))}
      series={seriesData}
      range={range}
      tab={tab}
    />
  );
};

const LogsPage = ({ searchParams }: LogsPageProps) => {
  return (
    <Suspense fallback={<div className="text-sm text-zinc-500">Loading logs...</div>}>
      <LogsPageContent searchParams={searchParams} />
    </Suspense>
  );
};

export default LogsPage;

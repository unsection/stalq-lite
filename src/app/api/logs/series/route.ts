import { and, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { scrapeLogs } from "@/db/schema";
import type { DateRange } from "@/lib/constants";
import { getRangeStart } from "@/lib/dates";

const parseRange = (value: string | null): DateRange => {
  if (value === "7d" || value === "30d" || value === "90d") return value;
  return "30d";
};

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const range = parseRange(searchParams.get("range"));
  const productId = searchParams.get("productId");
  const since = getRangeStart(range);

  const conditions = [gte(scrapeLogs.createdAt, since)];

  if (productId) {
    conditions.push(eq(scrapeLogs.productId, productId));
  }

  const rows = await db
    .select({
      bucket: sql<string>`to_char(date_trunc('day', ${scrapeLogs.createdAt}), 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(scrapeLogs)
    .where(and(...conditions))
    .groupBy(sql`date_trunc('day', ${scrapeLogs.createdAt})`)
    .orderBy(sql`date_trunc('day', ${scrapeLogs.createdAt})`);

  return NextResponse.json({ range, series: rows });
};

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, scrapeLogs } from "@/db/schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;

  const [row] = await db
    .select({
      id: scrapeLogs.id,
      scrapeResponse: scrapeLogs.scrapeResponse,
      finishReason: scrapeLogs.finishReason,
      createdAt: scrapeLogs.createdAt,
      productName: products.name,
      productDomain: products.domain,
      productUrl: products.url,
    })
    .from(scrapeLogs)
    .innerJoin(products, eq(scrapeLogs.productId, products.id))
    .where(eq(scrapeLogs.id, id))
    .limit(1);

  if (!row) {
    return NextResponse.json({ message: "Log not found" }, { status: 404 });
  }

  if (!row.scrapeResponse) {
    return NextResponse.json({ message: "No scrape response for this log" }, { status: 404 });
  }

  return NextResponse.json({
    id: row.id,
    response: row.scrapeResponse,
    finishReason: row.finishReason,
    createdAt: row.createdAt,
    productName: row.productName,
    productDomain: row.productDomain,
    productUrl: row.productUrl,
  });
};

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { priceHistory, products, scrapeLogs } from "@/db/schema";
import { productUpdateSchema } from "@/lib/validation";
import { extractDomain } from "@/lib/utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);

  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  const history = await db
    .select()
    .from(priceHistory)
    .where(eq(priceHistory.productId, id))
    .orderBy(priceHistory.scrapedAt);

  const logs = await db
    .select()
    .from(scrapeLogs)
    .where(eq(scrapeLogs.productId, id))
    .orderBy(scrapeLogs.createdAt);

  return NextResponse.json({ product, history, logs });
};

export const PATCH = async (request: Request, context: RouteContext) => {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = productUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const updates: Partial<typeof products.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.ownProductId !== undefined) updates.ownProductId = input.ownProductId;
    if (input.name !== undefined) updates.name = input.name;
    if (input.url !== undefined) {
      updates.url = input.url;
      updates.domain = extractDomain(input.url);
    }
    if (input.useMainContentOnly !== undefined) updates.useMainContentOnly = input.useMainContentOnly;
    if (input.settleAnimations !== undefined) updates.settleAnimations = input.settleAnimations;
    if (input.includeSelectors !== undefined) updates.includeSelectors = input.includeSelectors;
    if (input.excludeSelectors !== undefined) updates.excludeSelectors = input.excludeSelectors;
    if (input.country !== undefined) updates.country = input.country || null;
    if (input.waitForMs !== undefined) updates.waitForMs = input.waitForMs ?? null;
    if (input.timeoutEnabled !== undefined) updates.timeoutEnabled = input.timeoutEnabled;
    if (input.timeoutMs !== undefined || input.timeoutEnabled !== undefined) {
      const timeoutEnabled = input.timeoutEnabled ?? false;
      updates.timeoutMs = timeoutEnabled ? input.timeoutMs ?? null : null;
    }

    const [updated] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update product" },
      { status: 500 },
    );
  }
};

export const DELETE = async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const [deleted] = await db.delete(products).where(eq(products.id, id)).returning();

  if (!deleted) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
};

import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { productInputSchema } from "@/lib/validation";
import { extractDomain } from "@/lib/utils";

export const GET = async () => {
  const rows = await db.select().from(products).orderBy(desc(products.createdAt));
  return NextResponse.json(rows);
};

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const parsed = productInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const [created] = await db
      .insert(products)
      .values({
        ownProductId: input.ownProductId,
        name: input.name,
        url: input.url,
        domain: extractDomain(input.url),
        useMainContentOnly: input.useMainContentOnly,
        settleAnimations: input.settleAnimations,
        includeSelectors: input.includeSelectors,
        excludeSelectors: input.excludeSelectors,
        country: input.country || null,
        waitForMs: input.waitForMs ?? null,
        timeoutEnabled: input.timeoutEnabled,
        timeoutMs: input.timeoutEnabled ? input.timeoutMs ?? null : null,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create product" },
      { status: 500 },
    );
  }
};

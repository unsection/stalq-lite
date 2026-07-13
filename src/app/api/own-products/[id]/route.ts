import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { ownProducts } from "@/db/schema";
import { ownProductUpdateSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const [product] = await db.select().from(ownProducts).where(eq(ownProducts.id, id)).limit(1);

  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
};

export const PATCH = async (request: Request, context: RouteContext) => {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = ownProductUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const updates: Partial<typeof ownProducts.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updates.name = input.name;
    if (input.sku !== undefined) updates.sku = input.sku;
    if (input.url !== undefined) updates.url = input.url;
    if (input.price !== undefined) updates.price = input.price.toFixed(2);

    const [updated] = await db
      .update(ownProducts)
      .set(updates)
      .where(eq(ownProducts.id, id))
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
  const [deleted] = await db.delete(ownProducts).where(eq(ownProducts.id, id)).returning();

  if (!deleted) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
};

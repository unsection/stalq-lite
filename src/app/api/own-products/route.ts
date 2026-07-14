import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { ownProducts } from "@/db/schema";
import { ownProductInputSchema } from "@/lib/validation";

export const GET = async () => {
  const rows = await db.select().from(ownProducts).orderBy(desc(ownProducts.createdAt));
  return NextResponse.json(rows);
};

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const parsed = ownProductInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const [created] = await db
      .insert(ownProducts)
      .values({
        name: input.name,
        sku: input.sku,
        url: input.url,
        price: input.price.toFixed(2),
        costPerUnit: input.costPerUnit?.toFixed(2),
        marketplaceFeePercent: input.marketplaceFeePercent?.toFixed(2),
        shippingCostPerUnit: input.shippingCostPerUnit?.toFixed(2),
        targetMarginPercent: input.targetMarginPercent?.toFixed(2),
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

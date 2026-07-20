import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { websiteScrapeSettings } from "@/db/schema";
import { extractDomain } from "@/lib/utils";
import { websiteScrapeSettingsSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = async (request: Request, context: RouteContext) => {
  const { id } = await context.params;
  try {
    const parsed = websiteScrapeSettingsSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ message: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    const input = parsed.data;
    const [updated] = await db.update(websiteScrapeSettings).set({
      name: input.name,
      domain: extractDomain(input.domain),
      method: input.method,
      settings: input.settings,
      updatedAt: new Date(),
    }).where(eq(websiteScrapeSettings.id, id)).returning();
    if (!updated) return NextResponse.json({ message: "Website not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Failed to save website" }, { status: 500 });
  }
};

export const DELETE = async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const [deleted] = await db.delete(websiteScrapeSettings).where(eq(websiteScrapeSettings.id, id)).returning();
  if (!deleted) return NextResponse.json({ message: "Website not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
};

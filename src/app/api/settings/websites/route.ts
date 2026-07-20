import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { websiteScrapeSettings } from "@/db/schema";
import { extractDomain } from "@/lib/utils";
import { websiteScrapeSettingsSchema } from "@/lib/validation";

export const GET = async () =>
  NextResponse.json(await db.select().from(websiteScrapeSettings).orderBy(asc(websiteScrapeSettings.name)));

export const POST = async (request: Request) => {
  try {
    const parsed = websiteScrapeSettingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ message: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
    }
    const input = parsed.data;
    const [created] = await db.insert(websiteScrapeSettings).values({
      name: input.name,
      domain: extractDomain(input.domain),
      method: input.method,
      settings: input.settings,
    }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Failed to save website" }, { status: 500 });
  }
};

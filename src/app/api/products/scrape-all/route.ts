import { NextResponse } from "next/server";
import { scrapeAllProducts } from "@/lib/scrape/scrapeAllProducts";

export const maxDuration = 300;

export const POST = async () => {
  try {
    const summary = await scrapeAllProducts();
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to scrape all products" },
      { status: 500 },
    );
  }
};

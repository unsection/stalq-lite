import { NextResponse } from "next/server";
import { runProductScrape } from "@/lib/scrape/runProductScrape";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = async (_request: Request, context: RouteContext) => {
  const { id } = await context.params;
  const result = await runProductScrape(id);

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message, ...(result.data ? { data: result.data } : {}) },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data);
};

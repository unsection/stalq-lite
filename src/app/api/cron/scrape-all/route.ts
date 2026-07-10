import { NextResponse } from "next/server";
import {
  getScheduleSettings,
  markScheduleRun,
} from "@/lib/schedule/getScheduleSettings";
import { shouldRunNow } from "@/lib/schedule/shouldRunNow";
import { verifyCronSecret } from "@/lib/schedule/constants";
import { scrapeAllProducts } from "@/lib/scrape/scrapeAllProducts";

export const maxDuration = 300;

export const GET = async (request: Request) => {
  const auth = verifyCronSecret(request);
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const settings = await getScheduleSettings();
  const match = shouldRunNow({
    enabled: settings.enabled,
    frequency: settings.frequency,
    primaryTime: settings.primaryTime,
    secondaryTime: settings.secondaryTime,
    timezone: settings.timezone,
    lastRunSlot: settings.lastRunSlot,
  });

  if (!match.shouldRun || !match.slotKey) {
    return NextResponse.json({
      ok: true,
      ran: false,
      reason: match.reason,
      slotKey: match.slotKey,
    });
  }

  await markScheduleRun(match.slotKey);
  const summary = await scrapeAllProducts();

  return NextResponse.json({
    ok: true,
    ran: true,
    slotKey: match.slotKey,
    summary,
  });
};

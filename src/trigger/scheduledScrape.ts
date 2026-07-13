import { schedules } from "@trigger.dev/sdk";
import {
  getScheduleSettings,
  markScheduleRun,
} from "@/lib/schedule/getScheduleSettings";
import { formatSlotKey } from "@/lib/schedule/slots";
import { scrapeAllProducts } from "@/lib/scrape/scrapeAllProducts";

export const SCHEDULED_SCRAPE_TASK_ID = "scheduled-scrape";

/**
 * Runs at the user's configured times via imperative schedules created in
 * syncTriggerSchedules — no polling, Trigger.dev fires exactly on the cron.
 */
export const scheduledScrapeTask = schedules.task({
  id: SCHEDULED_SCRAPE_TASK_ID,
  maxDuration: 300,
  run: async (payload) => {
    const settings = await getScheduleSettings();

    // Safety net if a schedule outlives a disabled setting.
    if (!settings.enabled) {
      return { ran: false, reason: "disabled" as const };
    }

    const slotKey = formatSlotKey(payload.timestamp, settings.timezone);
    const summary = await scrapeAllProducts();
    await markScheduleRun(slotKey);

    return { ran: true, slotKey, summary };
  },
});

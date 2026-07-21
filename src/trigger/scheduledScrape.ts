import { inArray } from "drizzle-orm";
import { schedules } from "@trigger.dev/sdk";
import { db } from "@/db";
import { ownProducts } from "@/db/schema";
import { detectUndercuts } from "@/lib/alerts/detectUndercuts";
import { sendUndercutEmail } from "@/lib/alerts/sendUndercutEmail";
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
    const { summary, results } = await scrapeAllProducts();
    await markScheduleRun(slotKey);

    const ownProductIds = [
      ...new Set(
        results
          .map((result) => result.ownProductId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    let alertsSent = 0;
    let alertsFound = 0;

    if (ownProductIds.length > 0) {
      const ownRows = await db
        .select({
          id: ownProducts.id,
          name: ownProducts.name,
          price: ownProducts.price,
          currency: ownProducts.currency,
        })
        .from(ownProducts)
        .where(inArray(ownProducts.id, ownProductIds));

      const alerts = detectUndercuts(results, ownRows);
      alertsFound = alerts.length;

      if (alerts.length > 0) {
        try {
          const emailResult = await sendUndercutEmail(alerts);
          if (emailResult.sent) {
            alertsSent = alerts.length;
          }
        } catch (error) {
          console.error(
            "[scheduled-scrape] Undercut email failed:",
            error instanceof Error ? error.message : error,
          );
        }
      }
    }

    return { ran: true, slotKey, summary, alertsFound, alertsSent };
  },
});

import "dotenv/config";
import { config } from "dotenv";
import { schedules } from "@trigger.dev/sdk";
import { getScheduleSettings } from "../src/lib/schedule/getScheduleSettings";
import { syncTriggerSchedules } from "../src/lib/schedule/syncTriggerSchedules";

config({ path: ".env.local" });

const main = async () => {
  const settings = await getScheduleSettings();
  console.log("settings", {
    enabled: settings.enabled,
    frequency: settings.frequency,
    primaryTime: settings.primaryTime,
    secondaryTime: settings.secondaryTime,
    timezone: settings.timezone,
  });

  const result = await syncTriggerSchedules(settings);
  console.log("sync", result);

  const existing = await schedules.list({ perPage: 100 });
  console.log("schedules", existing.data.length);
  for (const schedule of existing.data) {
    console.log(
      [
        schedule.id,
        schedule.task,
        schedule.cron,
        schedule.timezone,
        `active=${schedule.active}`,
        schedule.externalId,
      ].join(" | "),
    );
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

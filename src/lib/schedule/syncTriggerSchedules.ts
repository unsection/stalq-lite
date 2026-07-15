import { schedules } from "@trigger.dev/sdk";
import type { ScheduleSettings } from "@/db/schema";

const EXTERNAL_ID = "stalq-global";
const LEGACY_EXTERNAL_ID = "stalq-lite-global";
const TASK_ID = "scheduled-scrape";

const getScheduleEnvironment = () =>
  process.env.TRIGGER_SECRET_KEY?.split("_")[1] ?? "unknown";

const toCron = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return `${minutes} ${hours} * * *`;
};

/**
 * Mirror the saved settings to Trigger.dev imperative schedules:
 * one cron per configured time, none when disabled. Idempotent —
 * existing schedules for this app are replaced on every save.
 */
export const syncTriggerSchedules = async (settings: ScheduleSettings) => {
  const environment = getScheduleEnvironment();
  const existing = await schedules.list({ perPage: 100 });
  const ours = existing.data.filter(
    (schedule) =>
      schedule.externalId === EXTERNAL_ID || schedule.externalId === LEGACY_EXTERNAL_ID,
  );

  for (const schedule of ours) {
    await schedules.del(schedule.id);
  }

  if (!settings.enabled) {
    return { created: 0 };
  }

  const times = [settings.primaryTime];
  if (settings.frequency === 2 && settings.secondaryTime) {
    times.push(settings.secondaryTime);
  }

  for (const [index, time] of times.entries()) {
    await schedules.create({
      task: TASK_ID,
      cron: toCron(time),
      timezone: settings.timezone,
      externalId: EXTERNAL_ID,
      deduplicationKey: `stalq-scrape-${environment}-${
        index === 0 ? "primary" : "secondary"
      }`,
    });
  }

  return { created: times.length };
};

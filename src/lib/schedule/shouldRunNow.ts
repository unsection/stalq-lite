export type ScheduleConfig = {
  enabled: boolean;
  frequency: number;
  primaryTime: string;
  secondaryTime: string | null;
  timezone: string;
  lastRunSlot: string | null;
};

export type ScheduleMatch = {
  shouldRun: boolean;
  slotKey: string | null;
  reason: "disabled" | "no_slot" | "already_ran" | "matched";
};

const parseTime = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return { hours, minutes };
};

const getLocalParts = (date: Date, timezone: string) => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "0";

  // Some engines report midnight as "24"; normalize to 0.
  const hours = Number(get("hour")) % 24;

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hours,
    minutes: Number(get("minute")),
  };
};

const minutesSinceMidnight = (hours: number, minutes: number) => hours * 60 + minutes;

const buildSlotKey = (date: Date, timezone: string, time: string) => {
  const local = getLocalParts(date, timezone);
  const { hours, minutes } = parseTime(time);
  return `${local.year}-${local.month}-${local.day}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

/**
 * Catch-up matcher: a slot is due once its local time has passed today and it
 * has not yet been recorded in lastRunSlot. This tolerates delayed cron
 * runners (e.g. GitHub Actions schedule jitter).
 */
export const shouldRunNow = (
  config: ScheduleConfig,
  now: Date = new Date(),
): ScheduleMatch => {
  if (!config.enabled) {
    return { shouldRun: false, slotKey: null, reason: "disabled" };
  }

  const local = getLocalParts(now, config.timezone);
  const nowMinutes = minutesSinceMidnight(local.hours, local.minutes);

  const slots = [config.primaryTime];
  if (config.frequency === 2 && config.secondaryTime) {
    slots.push(config.secondaryTime);
  }

  let dueAlreadyRan: string | null = null;

  for (const slot of slots) {
    const { hours, minutes } = parseTime(slot);
    const slotMinutes = minutesSinceMidnight(hours, minutes);

    if (nowMinutes < slotMinutes) {
      continue;
    }

    const slotKey = buildSlotKey(now, config.timezone, slot);

    if (config.lastRunSlot === slotKey) {
      dueAlreadyRan = slotKey;
      continue;
    }

    return { shouldRun: true, slotKey, reason: "matched" };
  }

  if (dueAlreadyRan) {
    return { shouldRun: false, slotKey: dueAlreadyRan, reason: "already_ran" };
  }

  return { shouldRun: false, slotKey: null, reason: "no_slot" };
};

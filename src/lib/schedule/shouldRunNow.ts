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

const WINDOW_MINUTES = 5;

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

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hours: Number(get("hour")),
    minutes: Number(get("minute")),
  };
};

const minutesSinceMidnight = (hours: number, minutes: number) => hours * 60 + minutes;

const buildSlotKey = (date: Date, timezone: string, time: string) => {
  const local = getLocalParts(date, timezone);
  const { hours, minutes } = parseTime(time);
  return `${local.year}-${local.month}-${local.day}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const isWithinWindow = (
  nowMinutes: number,
  slotMinutes: number,
  windowMinutes: number,
) => Math.abs(nowMinutes - slotMinutes) <= windowMinutes;

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

  for (const slot of slots) {
    const { hours, minutes } = parseTime(slot);
    const slotMinutes = minutesSinceMidnight(hours, minutes);

    if (!isWithinWindow(nowMinutes, slotMinutes, WINDOW_MINUTES)) {
      continue;
    }

    const slotKey = buildSlotKey(now, config.timezone, slot);

    if (config.lastRunSlot === slotKey) {
      return { shouldRun: false, slotKey, reason: "already_ran" };
    }

    return { shouldRun: true, slotKey, reason: "matched" };
  }

  return { shouldRun: false, slotKey: null, reason: "no_slot" };
};

/** Completed-slot bookkeeping shown on the Settings page. */

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

/** Slot key like "2026-07-13T10:00" for a moment in the given timezone. */
export const formatSlotKey = (date: Date, timezone: string) => {
  const local = getLocalParts(date, timezone);
  return `${local.year}-${local.month}-${local.day}T${String(local.hours).padStart(2, "0")}:${String(local.minutes).padStart(2, "0")}`;
};

/** Parse stored completed slots (JSON array or legacy single key). */
export const parseCompletedSlots = (raw: string | null | undefined): string[] => {
  if (!raw) return [];

  if (raw.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item): item is string => typeof item === "string");
    } catch {
      return [];
    }
  }

  return [raw];
};

/** Keep same-day slots and append the new one. */
export const appendCompletedSlot = (
  existingRaw: string | null | undefined,
  slotKey: string,
): string => {
  const dayPrefix = slotKey.slice(0, 10);
  const existing = parseCompletedSlots(existingRaw).filter((slot) =>
    slot.startsWith(dayPrefix),
  );
  return JSON.stringify([...new Set([...existing, slotKey])]);
};

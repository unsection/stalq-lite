export type StripDayStatus = "above" | "below" | "same" | "none";

export type PriceHistoryPoint = {
  price: number;
  scrapedAt: Date;
};

export type StripDay = {
  /** UTC midnight for this calendar day. */
  date: Date;
  competitorPrice: number | null;
  yourPrice: number;
  status: StripDayStatus;
  /** Competitor price minus your price; null when no competitor price. */
  difference: number | null;
};

/** Treat prices within a cent as equal. */
export const PRICE_EQUALITY_TOLERANCE = 0.01;

export const compareCompetitorToOwn = (
  competitorPrice: number,
  yourPrice: number,
): StripDayStatus => {
  const difference = competitorPrice - yourPrice;
  if (Math.abs(difference) <= PRICE_EQUALITY_TOLERANCE) return "same";
  return difference > 0 ? "above" : "below";
};

/** Calendar day key in UTC — stable across SSR and the browser. */
export const utcDayKey = (date: Date) => date.toISOString().slice(0, 10);

const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const subUtcDays = (date: Date, amount: number) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - amount),
  );

/**
 * Build one bar per UTC calendar day for the last `dayCount` days (oldest → newest).
 * Multiple scrapes on the same UTC day use the last price that day.
 * Each day is compared against the current own price.
 *
 * Days are keyed in UTC so server HTML and client hydration never disagree
 * (local `startOfDay` / `format` would shift bars for users outside UTC).
 */
export const buildPriceHistoryStripDays = (
  history: PriceHistoryPoint[],
  yourPrice: number,
  options?: {
    now?: Date;
    dayCount?: number;
  },
): StripDay[] => {
  const now = options?.now ?? new Date();
  const dayCount = options?.dayCount ?? 30;
  const priceByDay = new Map<string, number>();

  const sorted = [...history].sort(
    (left, right) => left.scrapedAt.getTime() - right.scrapedAt.getTime(),
  );

  for (const point of sorted) {
    priceByDay.set(utcDayKey(point.scrapedAt), point.price);
  }

  const days: StripDay[] = [];

  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    const date = startOfUtcDay(subUtcDays(now, offset));
    const competitorPrice = priceByDay.get(utcDayKey(date)) ?? null;

    if (competitorPrice == null) {
      days.push({
        date,
        competitorPrice: null,
        yourPrice,
        status: "none",
        difference: null,
      });
      continue;
    }

    const difference = competitorPrice - yourPrice;
    days.push({
      date,
      competitorPrice,
      yourPrice,
      status: compareCompetitorToOwn(competitorPrice, yourPrice),
      difference,
    });
  }

  return days;
};

/** Format a UTC-midnight strip day for tooltips (e.g. "Tue, Jul 21"). */
export const formatStripDayLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);

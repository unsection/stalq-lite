import { format, startOfDay, subDays } from "date-fns";

export type StripDayStatus = "above" | "below" | "same" | "none";

export type PriceHistoryPoint = {
  price: number;
  scrapedAt: Date;
};

export type StripDay = {
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

const dayKey = (date: Date) => format(date, "yyyy-MM-dd");

/**
 * Build one bar per calendar day for the last `dayCount` days (oldest → newest).
 * Multiple scrapes on the same day use the last price that day.
 * Each day is compared against the current own price.
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
    priceByDay.set(dayKey(point.scrapedAt), point.price);
  }

  const days: StripDay[] = [];

  for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
    const date = startOfDay(subDays(now, offset));
    const competitorPrice = priceByDay.get(dayKey(date)) ?? null;

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

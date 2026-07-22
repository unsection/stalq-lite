import type { OwnProduct } from "@/db/schema";
import type { TrackerProduct } from "@/lib/pricing/getDashboardData";

const HOME_PRICE_HISTORY_DAY_COUNT = 14;

export type HomePriceHistoryDatum = {
  dateKey: string;
  dateLabel: string;
  longDateLabel: string;
  cheapestPrice: number | null;
  cheapestCompetitorName: string | null;
  yourPrice: number | null;
  isToday: boolean;
  isFuture: boolean;
};

export type HomePriceHistorySeries = {
  mode: "first" | "last";
  rangeLabel: string;
  todayKey: string;
  data: HomePriceHistoryDatum[];
  matchingCompetitorCount: number;
  mismatchedCurrencyCount: number;
  hasCompatibleHistory: boolean;
};

type BuildHomePriceHistoryOptions = {
  ownProduct: OwnProduct;
  competitors: TrackerProduct[];
  now?: Date;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addUtcDays = (date: Date, amount: number) =>
  new Date(date.getTime() + amount * MS_PER_DAY);

const utcDayKey = (date: Date) => date.toISOString().slice(0, 10);

const formatDate = (date: Date, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date);

const formatRangeLabel = (start: Date, end: Date) =>
  `${formatDate(start, { month: "short", day: "numeric" })} – ${formatDate(end, {
    month: "short",
    day: "numeric",
  })}`;

const normalizeCurrency = (currency: string | null | undefined) =>
  (currency ?? "USD").toUpperCase();

export const buildHomePriceHistory = ({
  ownProduct,
  competitors,
  now = new Date(),
}: BuildHomePriceHistoryOptions): HomePriceHistorySeries => {
  const today = startOfUtcDay(now);
  const productStart = startOfUtcDay(new Date(ownProduct.createdAt));
  const ageInDays = Math.floor((today.getTime() - productStart.getTime()) / MS_PER_DAY);
  const mode = ageInDays >= 0 && ageInDays < HOME_PRICE_HISTORY_DAY_COUNT ? "first" : "last";
  const rangeStart = mode === "first" ? productStart : addUtcDays(today, -(HOME_PRICE_HISTORY_DAY_COUNT - 1));
  const rangeEnd = addUtcDays(rangeStart, HOME_PRICE_HISTORY_DAY_COUNT - 1);
  const productCurrency = normalizeCurrency(ownProduct.currency);
  const matchingCompetitors = competitors.filter(
    (competitor) => normalizeCurrency(competitor.currency) === productCurrency,
  );
  const histories = matchingCompetitors.map((competitor) => ({
    competitor,
    points: competitor.history
      .map((point) => ({
        price: Number(point.price),
        timestamp: new Date(point.scrapedAt).getTime(),
      }))
      .filter((point) => Number.isFinite(point.price) && point.price > 0 && Number.isFinite(point.timestamp))
      .sort((left, right) => left.timestamp - right.timestamp),
    pointIndex: 0,
    latestPrice: null as number | null,
  }));
  const yourPrice = Number(ownProduct.price);

  const data = Array.from({ length: HOME_PRICE_HISTORY_DAY_COUNT }, (_, index) => {
    const date = addUtcDays(rangeStart, index);
    const isFuture = date.getTime() > today.getTime();

    if (!isFuture) {
      const endOfDay = addUtcDays(date, 1).getTime();
      const observationCutoff = Math.min(endOfDay, now.getTime() + 1);

      for (const history of histories) {
        while (
          history.pointIndex < history.points.length &&
          history.points[history.pointIndex]!.timestamp < observationCutoff
        ) {
          history.latestPrice = history.points[history.pointIndex]!.price;
          history.pointIndex += 1;
        }
      }
    }

    let cheapestPrice: number | null = null;
    let cheapestCompetitorName: string | null = null;

    if (!isFuture) {
      for (const history of histories) {
        if (history.latestPrice == null) continue;
        if (cheapestPrice == null || history.latestPrice < cheapestPrice) {
          cheapestPrice = history.latestPrice;
          cheapestCompetitorName = history.competitor.name;
        }
      }
    }

    return {
      dateKey: utcDayKey(date),
      dateLabel: formatDate(date, { month: "short", day: "numeric" }),
      longDateLabel: formatDate(date, { weekday: "short", month: "short", day: "numeric" }),
      cheapestPrice,
      cheapestCompetitorName,
      yourPrice: isFuture ? null : yourPrice,
      isToday: date.getTime() === today.getTime(),
      isFuture,
    } satisfies HomePriceHistoryDatum;
  });

  return {
    mode,
    rangeLabel: formatRangeLabel(rangeStart, rangeEnd),
    todayKey: utcDayKey(today),
    data,
    matchingCompetitorCount: matchingCompetitors.length,
    mismatchedCurrencyCount: competitors.length - matchingCompetitors.length,
    hasCompatibleHistory: data.some((point) => point.cheapestPrice != null),
  };
};

export type PricePoint = {
  price: number;
  scrapedAt: Date;
};

export type PriceMovement = {
  current: number | null;
  previous: number | null;
  change: number | null;
  changePercent: number | null;
  direction: "up" | "down" | "flat" | "unknown";
  low: number | null;
  high: number | null;
  sparkline: number[];
};

export const computePriceMovement = (
  history: PricePoint[],
  currentPrice: number | null,
): PriceMovement => {
  const prices = history.map((point) => point.price);

  if (currentPrice != null && (prices.length === 0 || prices[prices.length - 1] !== currentPrice)) {
    prices.push(currentPrice);
  }

  if (prices.length === 0) {
    return {
      current: currentPrice,
      previous: null,
      change: null,
      changePercent: null,
      direction: "unknown",
      low: null,
      high: null,
      sparkline: [],
    };
  }

  const current = prices[prices.length - 1];
  const previous = prices.length > 1 ? prices[prices.length - 2] : null;
  const change = previous != null ? current - previous : null;
  const changePercent =
    previous != null && previous !== 0 ? (change! / previous) * 100 : null;

  let direction: PriceMovement["direction"] = "unknown";
  if (change != null) {
    if (change > 0) direction = "up";
    else if (change < 0) direction = "down";
    else direction = "flat";
  }

  return {
    current,
    previous,
    change,
    changePercent,
    direction,
    low: Math.min(...prices),
    high: Math.max(...prices),
    sparkline: prices.slice(-14),
  };
};

export type DashboardSummary = {
  total: number;
  drops: number;
  increases: number;
  stable: number;
  unscrape: number;
};

export const computeDashboardSummary = (
  movements: PriceMovement[],
): DashboardSummary => {
  let drops = 0;
  let increases = 0;
  let stable = 0;
  let unscrape = 0;

  for (const movement of movements) {
    if (movement.current == null) {
      unscrape++;
      continue;
    }
    if (movement.direction === "down") drops++;
    else if (movement.direction === "up") increases++;
    else if (movement.direction === "flat") stable++;
    else unscrape++;
  }

  return {
    total: movements.length,
    drops,
    increases,
    stable,
    unscrape,
  };
};

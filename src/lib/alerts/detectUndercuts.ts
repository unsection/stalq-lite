import type { ScrapeProductResult } from "@/lib/scrape/scrapeAllProducts";

export type OwnProductPrice = {
  id: string;
  name: string;
  price: number | string;
  currency: string;
};

export type UndercutAlert = {
  ownProductName: string;
  ownPrice: number;
  competitorName: string;
  competitorUrl: string;
  previousPrice: number | null;
  newPrice: number;
  currency: string;
};

const parsePrice = (value: number | string | null | undefined): number | null => {
  if (value == null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Alert when a competitor's new price is strictly below the linked own product
 * AND either there was no previous price, or the new price dropped vs previous.
 */
export const detectUndercuts = (
  results: ScrapeProductResult[],
  ownProducts: OwnProductPrice[],
): UndercutAlert[] => {
  const ownById = new Map(
    ownProducts.map((product) => [product.id, product] as const),
  );
  const alerts: UndercutAlert[] = [];

  for (const result of results) {
    if (!result.ownProductId) continue;

    const newPrice = parsePrice(result.newPrice);
    if (newPrice == null) continue;

    const own = ownById.get(result.ownProductId);
    if (!own) continue;

    const ownPrice = parsePrice(own.price);
    if (ownPrice == null) continue;

    if (newPrice >= ownPrice) continue;

    const previousPrice = parsePrice(result.previousPrice);
    const dropped = previousPrice == null || newPrice < previousPrice;
    if (!dropped) continue;

    alerts.push({
      ownProductName: own.name,
      ownPrice,
      competitorName: result.name,
      competitorUrl: result.url,
      previousPrice,
      newPrice,
      currency: result.currency ?? own.currency,
    });
  }

  return alerts;
};

import { describe, expect, it } from "vitest";
import type { OwnProduct } from "@/db/schema";
import type { TrackerProduct } from "@/lib/pricing/getDashboardData";
import { buildHomePriceHistory } from "./homePriceHistory";

const ownProduct = (overrides: Partial<OwnProduct> = {}): OwnProduct => ({
  id: "own-1",
  name: "Mouse",
  sku: null,
  url: "https://example.com/mouse",
  price: "70.00",
  currency: "USD",
  costPerUnit: "40.00",
  marketplaceFeePercent: "2.00",
  shippingCostPerUnit: "0.00",
  targetMarginPercent: "25.00",
  createdAt: new Date("2026-07-20T15:00:00.000Z"),
  updatedAt: new Date("2026-07-20T15:00:00.000Z"),
  ...overrides,
});

const competitor = ({
  id,
  name,
  currency = "USD",
  history,
}: {
  id: string;
  name: string;
  currency?: string;
  history: Array<{ price: number; scrapedAt: string }>;
}): TrackerProduct => ({
  id,
  ownProductId: "own-1",
  name,
  url: `https://${name}.com/item`,
  domain: `${name}.com`,
  currentPrice: history.at(-1)?.price.toFixed(2) ?? null,
  currency,
  useMainContentOnly: false,
  settleAnimations: false,
  includeSelectors: [],
  excludeSelectors: [],
  country: null,
  waitForMs: null,
  timeoutEnabled: false,
  timeoutMs: null,
  lastScrapedAt: history.at(-1) ? new Date(history.at(-1)!.scrapedAt) : null,
  createdAt: new Date("2026-07-20T00:00:00.000Z"),
  updatedAt: new Date("2026-07-20T00:00:00.000Z"),
  movement: {
    current: history.at(-1)?.price ?? null,
    previous: null,
    change: null,
    changePercent: null,
    direction: "unknown",
    low: history.length ? Math.min(...history.map((point) => point.price)) : null,
    high: history.length ? Math.max(...history.map((point) => point.price)) : null,
    sparkline: history.map((point) => point.price),
  },
  history,
});

describe("buildHomePriceHistory", () => {
  it("uses the product creation day for the first 14-day window and leaves future dates empty", () => {
    const series = buildHomePriceHistory({
      ownProduct: ownProduct(),
      competitors: [],
      now: new Date("2026-07-23T10:00:00.000Z"),
    });

    expect(series.mode).toBe("first");
    expect(series.rangeLabel).toBe("Jul 20 – Aug 2");
    expect(series.data).toHaveLength(14);
    expect(series.data[0]?.dateKey).toBe("2026-07-20");
    expect(series.data[3]?.isToday).toBe(true);
    expect(series.data[4]).toMatchObject({ isFuture: true, cheapestPrice: null, yourPrice: null });
  });

  it("switches to a rolling 14-day window after the initial period", () => {
    const series = buildHomePriceHistory({
      ownProduct: ownProduct({ createdAt: new Date("2026-06-01T00:00:00.000Z") }),
      competitors: [],
      now: new Date("2026-07-23T10:00:00.000Z"),
    });

    expect(series.mode).toBe("last");
    expect(series.rangeLabel).toBe("Jul 10 – Jul 23");
    expect(series.data[0]?.dateKey).toBe("2026-07-10");
    expect(series.data[13]?.isToday).toBe(true);
  });

  it("uses the latest same-day price, carries it forward, and changes the cheapest competitor", () => {
    const series = buildHomePriceHistory({
      ownProduct: ownProduct(),
      competitors: [
        competitor({
          id: "a",
          name: "Alpha",
          history: [
            { price: 90, scrapedAt: "2026-07-20T08:00:00.000Z" },
            { price: 80, scrapedAt: "2026-07-20T18:00:00.000Z" },
          ],
        }),
        competitor({
          id: "b",
          name: "Beta",
          history: [{ price: 75, scrapedAt: "2026-07-22T09:00:00.000Z" }],
        }),
      ],
      now: new Date("2026-07-23T10:00:00.000Z"),
    });

    expect(series.data[0]).toMatchObject({ cheapestPrice: 80, cheapestCompetitorName: "Alpha" });
    expect(series.data[1]).toMatchObject({ cheapestPrice: 80, cheapestCompetitorName: "Alpha" });
    expect(series.data[2]).toMatchObject({ cheapestPrice: 75, cheapestCompetitorName: "Beta" });
    expect(series.data[3]).toMatchObject({ cheapestPrice: 75, cheapestCompetitorName: "Beta" });
  });

  it("carries a price recorded before a rolling window into its first day", () => {
    const series = buildHomePriceHistory({
      ownProduct: ownProduct({ createdAt: new Date("2026-06-01T00:00:00.000Z") }),
      competitors: [
        competitor({
          id: "a",
          name: "Alpha",
          history: [{ price: 82, scrapedAt: "2026-07-01T08:00:00.000Z" }],
        }),
      ],
      now: new Date("2026-07-23T10:00:00.000Z"),
    });

    expect(series.data[0]?.cheapestPrice).toBe(82);
    expect(series.data[13]?.cheapestPrice).toBe(82);
  });

  it("excludes competitors in a different currency", () => {
    const series = buildHomePriceHistory({
      ownProduct: ownProduct(),
      competitors: [
        competitor({
          id: "usd",
          name: "USD Shop",
          history: [{ price: 80, scrapedAt: "2026-07-20T08:00:00.000Z" }],
        }),
        competitor({
          id: "eur",
          name: "EUR Shop",
          currency: "EUR",
          history: [{ price: 60, scrapedAt: "2026-07-20T08:00:00.000Z" }],
        }),
      ],
      now: new Date("2026-07-20T10:00:00.000Z"),
    });

    expect(series.matchingCompetitorCount).toBe(1);
    expect(series.mismatchedCurrencyCount).toBe(1);
    expect(series.data[0]).toMatchObject({ cheapestPrice: 80, cheapestCompetitorName: "USD Shop" });
  });

  it("reports no compatible history when matching competitors have no successful checks", () => {
    const series = buildHomePriceHistory({
      ownProduct: ownProduct(),
      competitors: [competitor({ id: "empty", name: "Empty", history: [] })],
      now: new Date("2026-07-20T10:00:00.000Z"),
    });

    expect(series.matchingCompetitorCount).toBe(1);
    expect(series.hasCompatibleHistory).toBe(false);
  });
});

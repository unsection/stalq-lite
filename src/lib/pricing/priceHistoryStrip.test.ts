import { describe, expect, it } from "vitest";
import { format } from "date-fns";
import {
  buildPriceHistoryStripDays,
  compareCompetitorToOwn,
} from "./priceHistoryStrip";

describe("compareCompetitorToOwn", () => {
  it("marks competitor above as above", () => {
    expect(compareCompetitorToOwn(104.99, 78.99)).toBe("above");
  });

  it("marks competitor below as below", () => {
    expect(compareCompetitorToOwn(70, 78.99)).toBe("below");
  });

  it("treats near-equal prices as same", () => {
    expect(compareCompetitorToOwn(78.99, 78.99)).toBe("same");
    expect(compareCompetitorToOwn(78.995, 78.99)).toBe("same");
  });
});

describe("buildPriceHistoryStripDays", () => {
  it("builds 30 calendar days oldest to newest", () => {
    const now = new Date(2026, 6, 20, 15, 0, 0);
    const days = buildPriceHistoryStripDays([], 80, { now, dayCount: 30 });

    expect(days).toHaveLength(30);
    expect(format(days[0]!.date, "yyyy-MM-dd")).toBe("2026-06-21");
    expect(format(days[29]!.date, "yyyy-MM-dd")).toBe("2026-07-20");
    expect(days.every((day) => day.status === "none")).toBe(true);
  });

  it("uses the last scrape of each day and compares to your price", () => {
    const now = new Date(2026, 6, 20, 12, 0, 0);
    const days = buildPriceHistoryStripDays(
      [
        { price: 100, scrapedAt: new Date(2026, 6, 19, 8, 0, 0) },
        { price: 90, scrapedAt: new Date(2026, 6, 19, 18, 0, 0) },
        { price: 70, scrapedAt: new Date(2026, 6, 20, 9, 0, 0) },
      ],
      80,
      { now, dayCount: 3 },
    );

    expect(days).toHaveLength(3);
    expect(days[0]?.status).toBe("none");
    expect(days[1]?.status).toBe("above");
    expect(days[1]?.competitorPrice).toBe(90);
    expect(days[1]?.difference).toBe(10);
    expect(days[2]?.status).toBe("below");
    expect(days[2]?.competitorPrice).toBe(70);
  });
});

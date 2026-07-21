import { describe, expect, it } from "vitest";
import {
  buildPriceHistoryStripDays,
  compareCompetitorToOwn,
  formatStripDayLabel,
  utcDayKey,
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
  it("builds 30 UTC calendar days oldest to newest", () => {
    const now = new Date("2026-07-20T15:00:00.000Z");
    const days = buildPriceHistoryStripDays([], 80, { now, dayCount: 30 });

    expect(days).toHaveLength(30);
    expect(utcDayKey(days[0]!.date)).toBe("2026-06-21");
    expect(utcDayKey(days[29]!.date)).toBe("2026-07-20");
    expect(days.every((day) => day.status === "none")).toBe(true);
  });

  it("uses the last scrape of each UTC day and compares to your price", () => {
    const now = new Date("2026-07-20T12:00:00.000Z");
    const days = buildPriceHistoryStripDays(
      [
        { price: 100, scrapedAt: new Date("2026-07-19T08:00:00.000Z") },
        { price: 90, scrapedAt: new Date("2026-07-19T18:00:00.000Z") },
        { price: 70, scrapedAt: new Date("2026-07-20T09:00:00.000Z") },
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

  it("keeps late-UTC scrapes on the UTC day (not the next local day)", () => {
    // 18:00 UTC Jul 20 == 01:00 Asia/Bangkok Jul 21 — local bucketing would shift this.
    const now = new Date("2026-07-21T01:37:00.000Z");
    const days = buildPriceHistoryStripDays(
      [{ price: 89.99, scrapedAt: new Date("2026-07-20T18:00:00.000Z") }],
      78.99,
      { now, dayCount: 2 },
    );

    expect(days[0]?.status).toBe("above");
    expect(formatStripDayLabel(days[0]!.date)).toBe("Mon, Jul 20");
    expect(days[1]?.status).toBe("none");
    expect(formatStripDayLabel(days[1]!.date)).toBe("Tue, Jul 21");
  });
});

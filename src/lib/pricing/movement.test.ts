import { describe, expect, it } from "vitest";
import { computeDashboardSummary, computePriceMovement } from "./movement";

describe("computePriceMovement", () => {
  it("detects a price drop", () => {
    const movement = computePriceMovement(
      [
        { price: 30, scrapedAt: new Date() },
        { price: 25, scrapedAt: new Date() },
      ],
      25,
    );

    expect(movement.direction).toBe("down");
    expect(movement.change).toBe(-5);
    expect(movement.changePercent).toBeCloseTo(-16.67, 1);
    expect(movement.low).toBe(25);
    expect(movement.high).toBe(30);
  });

  it("detects a price increase", () => {
    const movement = computePriceMovement(
      [
        { price: 10, scrapedAt: new Date() },
        { price: 12.5, scrapedAt: new Date() },
      ],
      12.5,
    );

    expect(movement.direction).toBe("up");
    expect(movement.change).toBe(2.5);
  });
});

describe("computeDashboardSummary", () => {
  it("counts movement buckets", () => {
    const summary = computeDashboardSummary([
      computePriceMovement([{ price: 10, scrapedAt: new Date() }, { price: 8, scrapedAt: new Date() }], 8),
      computePriceMovement([{ price: 5, scrapedAt: new Date() }, { price: 6, scrapedAt: new Date() }], 6),
      computePriceMovement([{ price: 20, scrapedAt: new Date() }, { price: 20, scrapedAt: new Date() }], 20),
      computePriceMovement([], null),
    ]);

    expect(summary.total).toBe(4);
    expect(summary.drops).toBe(1);
    expect(summary.increases).toBe(1);
    expect(summary.stable).toBe(1);
    expect(summary.unscrape).toBe(1);
  });
});

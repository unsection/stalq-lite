import { describe, expect, it } from "vitest";
import { detectUndercuts } from "./detectUndercuts";
import type { ScrapeProductResult } from "../scrape/scrapeAllProducts";

const ownProducts = [
  { id: "own-1", name: "My Widget", price: "78.99", currency: "USD" },
];

const baseResult = (overrides: Partial<ScrapeProductResult>): ScrapeProductResult => ({
  productId: "comp-1",
  name: "Competitor A",
  url: "https://example.com/a",
  ownProductId: "own-1",
  previousPrice: 90,
  newPrice: 70,
  currency: "USD",
  ...overrides,
});

describe("detectUndercuts", () => {
  it("alerts on a new undercut (was above, now below)", () => {
    const alerts = detectUndercuts(
      [baseResult({ previousPrice: 90, newPrice: 70 })],
      ownProducts,
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      ownProductName: "My Widget",
      ownPrice: 78.99,
      competitorName: "Competitor A",
      previousPrice: 90,
      newPrice: 70,
    });
  });

  it("alerts on a further undercut (already cheaper, then dropped)", () => {
    const alerts = detectUndercuts(
      [baseResult({ previousPrice: 75, newPrice: 70 })],
      ownProducts,
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.newPrice).toBe(70);
  });

  it("skips a drop that is still above own price", () => {
    const alerts = detectUndercuts(
      [baseResult({ previousPrice: 100, newPrice: 85 })],
      ownProducts,
    );
    expect(alerts).toHaveLength(0);
  });

  it("skips an unchanged cheaper price", () => {
    const alerts = detectUndercuts(
      [baseResult({ previousPrice: 70, newPrice: 70 })],
      ownProducts,
    );
    expect(alerts).toHaveLength(0);
  });

  it("alerts on first scrape already cheaper", () => {
    const alerts = detectUndercuts(
      [baseResult({ previousPrice: null, newPrice: 70 })],
      ownProducts,
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.previousPrice).toBeNull();
  });

  it("skips equal price", () => {
    const alerts = detectUndercuts(
      [baseResult({ previousPrice: 90, newPrice: 78.99 })],
      ownProducts,
    );
    expect(alerts).toHaveLength(0);
  });

  it("skips competitors without an own product link", () => {
    const alerts = detectUndercuts(
      [baseResult({ ownProductId: null })],
      ownProducts,
    );
    expect(alerts).toHaveLength(0);
  });
});

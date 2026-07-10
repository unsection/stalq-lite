import { describe, expect, it } from "vitest";
import { extractPriceFromHtml, extractPriceFromText } from "./extractPriceFromHtml";

describe("extractPriceFromText", () => {
  it("parses US dollar prices", () => {
    expect(extractPriceFromText("US $24.99")).toEqual({ price: 24.99, currency: "USD" });
  });

  it("parses plain dollar prices", () => {
    expect(extractPriceFromText("$1,299.00")).toEqual({ price: 1299, currency: "USD" });
  });
});

describe("extractPriceFromHtml", () => {
  it("extracts nested eBay price markup", () => {
    const html = `<div class="x-price-primary"><span class="ux-textspans ux-textspans--BOLD">US $29.95</span></div>`;
    expect(extractPriceFromHtml(html)).toEqual({ price: 29.95, currency: "USD" });
  });

  it("extracts price from selector-only fragment", () => {
    const html = `<span class="x-price-primary">US $18.50</span>`;
    expect(extractPriceFromHtml(html)).toEqual({ price: 18.5, currency: "USD" });
  });
});

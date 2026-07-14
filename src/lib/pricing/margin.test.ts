import { describe, expect, it } from "vitest";
import { calculateMargin, getBreakEvenPrice, getTargetMarginPrice } from "./margin";

describe("margin calculations", () => {
  it("includes costs, marketplace fees, and shipping", () => {
    expect(
      calculateMargin({
        price: 100,
        costPerUnit: 56,
        marketplaceFeePercent: 10,
        shippingCostPerUnit: 4,
      }),
    ).toEqual({ marginPercent: 30, profitPerUnit: 30 });
  });

  it("calculates break-even and target-margin prices", () => {
    expect(getBreakEvenPrice(56, 10, 4)).toBeCloseTo(66.67, 2);
    expect(getTargetMarginPrice(56, 10, 4, 20)).toBeCloseTo(85.71, 2);
  });
});

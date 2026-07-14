export type MarginInputs = {
  price: number;
  costPerUnit: number;
  marketplaceFeePercent: number;
  shippingCostPerUnit: number;
};

export const calculateMargin = ({
  price,
  costPerUnit,
  marketplaceFeePercent,
  shippingCostPerUnit,
}: MarginInputs) => {
  if (price <= 0) return { marginPercent: 0, profitPerUnit: 0 };

  const marketplaceFee = price * (marketplaceFeePercent / 100);
  const profitPerUnit = price - costPerUnit - marketplaceFee - shippingCostPerUnit;

  return {
    marginPercent: (profitPerUnit / price) * 100,
    profitPerUnit,
  };
};

const getPriceForMargin = (
  costPerUnit: number,
  marketplaceFeePercent: number,
  shippingCostPerUnit: number,
  marginPercent: number,
) => {
  const remainingRevenue = 1 - marketplaceFeePercent / 100 - marginPercent / 100;
  if (remainingRevenue <= 0) return null;

  return (costPerUnit + shippingCostPerUnit) / remainingRevenue;
};

export const getBreakEvenPrice = (
  costPerUnit: number,
  marketplaceFeePercent: number,
  shippingCostPerUnit: number,
) => getPriceForMargin(costPerUnit, marketplaceFeePercent, shippingCostPerUnit, 0);

export const getTargetMarginPrice = (
  costPerUnit: number,
  marketplaceFeePercent: number,
  shippingCostPerUnit: number,
  targetMarginPercent: number,
) =>
  getPriceForMargin(
    costPerUnit,
    marketplaceFeePercent,
    shippingCostPerUnit,
    targetMarginPercent,
  );

import type { ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Plus,
  SlidersHorizontal,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import type { OwnProduct } from "@/db/schema";
import type { TrackerProduct } from "@/lib/pricing/getDashboardData";
import { calculateMargin, getBreakEvenPrice, getTargetMarginPrice } from "@/lib/pricing/margin";
import { cn, formatPrice } from "@/lib/utils";

const StatColumn = ({
  label,
  value,
  hint,
  dotClassName,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  dotClassName?: string;
  children?: ReactNode;
}) => (
  <div className="min-w-0">
    <p className="flex items-center gap-2 text-sm text-zinc-500">
      {dotClassName ? <span className={cn("h-1.5 w-1.5 rounded-full", dotClassName)} aria-hidden /> : null}
      {label}
    </p>
    <p className="num mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
    {children ?? (hint ? <p className="mt-1.5 text-sm text-zinc-500">{hint}</p> : null)}
  </div>
);

type ProductInfoCardProps = {
  product: OwnProduct | null;
  competitors: TrackerProduct[];
  onAddProduct?: () => void;
  onEditCosts?: () => void;
};

export const ProductInfoCard = ({
  product,
  competitors,
  onAddProduct,
  onEditCosts,
}: ProductInfoCardProps) => {
  if (!product) {
    return (
      <section className="rounded-3xl bg-zinc-900 p-6 text-center sm:p-10">
        <h2 className="text-xl font-semibold tracking-tight text-white">No products yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
          Add your own product to start tracking its price against competitors.
        </p>
        <button
          type="button"
          onClick={onAddProduct}
          className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-[#0080FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0066cc]"
        >
          <Plus className="h-4 w-4" weight="bold" />
          Add product
        </button>
      </section>
    );
  }

  const currency = product.currency ?? "USD";
  const yourPrice = Number(product.price);
  const costPerUnit = Number(product.costPerUnit);
  const marketplaceFeePercent = Number(product.marketplaceFeePercent);
  const shippingCostPerUnit = Number(product.shippingCostPerUnit);
  const targetMarginPercent = Number(product.targetMarginPercent);
  const currentMargin = calculateMargin({
    price: yourPrice,
    costPerUnit,
    marketplaceFeePercent,
    shippingCostPerUnit,
  });
  const competitorPrices = competitors
    .map((competitor) => competitor.movement.current)
    .filter((price): price is number => price !== null);
  const lowestCompetitor = competitorPrices.length ? Math.min(...competitorPrices) : null;
  const matchMargin = lowestCompetitor
    ? calculateMargin({
        price: lowestCompetitor,
        costPerUnit,
        marketplaceFeePercent,
        shippingCostPerUnit,
      })
    : null;
  const rank = [yourPrice, ...competitorPrices].sort((left, right) => left - right).indexOf(yourPrice) + 1;
  const breakEven = getBreakEvenPrice(costPerUnit, marketplaceFeePercent, shippingCostPerUnit);
  const targetPrice = getTargetMarginPrice(
    costPerUnit,
    marketplaceFeePercent,
    shippingCostPerUnit,
    targetMarginPercent,
  );
  const isLeading = lowestCompetitor !== null && yourPrice <= lowestCompetitor;
  const marginColor = currentMargin.marginPercent < 5 ? "bg-red-400" : "bg-emerald-400";

  return (
    <section className="rounded-3xl bg-zinc-900 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium uppercase tracking-wide">
            {product.sku ? <span className="text-zinc-500">{product.sku}</span> : null}
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
              Live tracking
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{product.name}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
            <UsersThree className="h-4 w-4" weight="duotone" />
            {competitors.length} competitor{competitors.length === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
            <Clock className="h-4 w-4" weight="duotone" />
            Product pricing
          </span>
          <button
            type="button"
            onClick={onEditCosts}
            aria-label={`Edit cost and margin settings for ${product.name}`}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
          >
            <SlidersHorizontal className="h-4 w-4 text-zinc-400" weight="duotone" />
            Cost {formatPrice(costPerUnit, currency)}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0">
        <div className="xl:pr-6">
          <StatColumn label="Your price" value={formatPrice(yourPrice, currency)} hint="Listed on your store" dotClassName="bg-white" />
        </div>
        <div className="xl:border-l xl:border-zinc-800 xl:px-6">
          <StatColumn
            label="Lowest competitor"
            value={lowestCompetitor === null ? "No price yet" : formatPrice(lowestCompetitor, currency)}
            dotClassName="bg-zinc-500"
          >
            {lowestCompetitor !== null ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium", isLeading ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
                  {isLeading ? <ArrowUpRight className="h-3 w-3" weight="bold" /> : <ArrowDownRight className="h-3 w-3" weight="bold" />}
                  {formatPrice(Math.abs(yourPrice - lowestCompetitor), currency)}
                </span>
                <span className="text-zinc-500">{isLeading ? "You hold the lead" : "Below your price"}</span>
              </div>
            ) : null}
          </StatColumn>
        </div>
        <div className="xl:border-l xl:border-zinc-800 xl:px-6">
          <StatColumn
            label="Current margin"
            value={`${currentMargin.marginPercent.toFixed(1)}%`}
            hint={`${formatPrice(currentMargin.profitPerUnit, currency)} profit per unit`}
            dotClassName={marginColor}
          />
        </div>
        <div className="xl:border-l xl:border-zinc-800 xl:pl-6">
          <StatColumn
            label="If you match lowest"
            value={matchMargin ? `${matchMargin.marginPercent.toFixed(1)}%` : "-"}
            hint={lowestCompetitor === null ? "Add a competitor to compare" : `at ${formatPrice(lowestCompetitor, currency)}`}
            dotClassName={matchMargin && matchMargin.marginPercent < 5 ? "bg-red-400" : "bg-emerald-400"}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-zinc-800 pt-4 text-sm text-zinc-500">
        <p>Rank <span className="font-medium text-white">#{rank}</span> of {competitors.length + 1}</p>
        <p>Break-even at <span className="font-medium text-white">{breakEven === null ? "-" : formatPrice(breakEven, currency)}</span></p>
        <p>{targetMarginPercent}% margin floor at <span className="font-medium text-white">{targetPrice === null ? "-" : formatPrice(targetPrice, currency)}</span></p>
      </div>
    </section>
  );
};

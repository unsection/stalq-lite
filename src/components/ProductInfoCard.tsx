import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Clock,
  PencilSimple,
  Plus,
  SlidersHorizontal,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import type { OwnProduct } from "@/db/schema";
import { cn, formatPrice } from "@/lib/utils";

/** Placeholder competitor/margin figures until competitor linking ships. */
const MOCK_STATS = {
  competitors: 8,
  updatedLabel: "updated 11h ago",
  cost: 56,
  lowestCompetitor: 79.09,
  leadDeltaPercent: 0,
  currentMarginPercent: 29.1,
  profitPerUnit: 23,
  matchLowestMarginPercent: 29.2,
  matchLowestPrice: 79.09,
  rank: 1,
  rankOf: 9,
  breakEven: 56,
  marginFloorPercent: 20,
  marginFloorPrice: 70,
};

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
      {dotClassName ? (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotClassName)} aria-hidden />
      ) : null}
      {label}
    </p>
    <p className="num mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
    {children ?? (hint ? <p className="mt-1.5 text-sm text-zinc-500">{hint}</p> : null)}
  </div>
);

type ProductInfoCardProps = {
  product: OwnProduct | null;
  onAddProduct?: () => void;
};

export const ProductInfoCard = ({ product, onAddProduct }: ProductInfoCardProps) => {
  const stats = MOCK_STATS;

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

  const yourPrice = Number(product.price);

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
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {product.name}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
            <UsersThree className="h-4 w-4" weight="duotone" />
            {stats.competitors} competitors
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
            <Clock className="h-4 w-4" weight="duotone" />
            {stats.updatedLabel}
          </span>
          <button
            type="button"
            aria-label={`Cost ${formatPrice(stats.cost)}`}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
          >
            <SlidersHorizontal className="h-4 w-4 text-zinc-400" weight="duotone" />
            Cost {formatPrice(stats.cost)}
          </button>
          <button
            type="button"
            aria-label="Edit product"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
          >
            <PencilSimple className="h-4 w-4 text-zinc-400" weight="duotone" />
            Edit
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0">
        <div className="xl:pr-6">
          <StatColumn
            label="Your price"
            value={formatPrice(yourPrice, product.currency ?? "USD")}
            hint="Listed on your store"
            dotClassName="bg-white"
          />
        </div>
        <div className="xl:border-l xl:border-zinc-800 xl:px-6">
          <StatColumn
            label="Lowest competitor"
            value={formatPrice(stats.lowestCompetitor)}
            dotClassName="bg-zinc-500"
          >
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-400">
                <ArrowUpRight className="h-3 w-3" weight="bold" />
                {stats.leadDeltaPercent}%
              </span>
              <span className="text-zinc-500">You hold the lead</span>
            </div>
          </StatColumn>
        </div>
        <div className="xl:border-l xl:border-zinc-800 xl:px-6">
          <StatColumn
            label="Current margin"
            value={`${stats.currentMarginPercent}%`}
            hint={`${formatPrice(stats.profitPerUnit)} profit per unit`}
            dotClassName="bg-emerald-400"
          />
        </div>
        <div className="xl:border-l xl:border-zinc-800 xl:pl-6">
          <StatColumn
            label="If you match lowest"
            value={`${stats.matchLowestMarginPercent}%`}
            hint={`at ${formatPrice(stats.matchLowestPrice)}`}
            dotClassName="bg-emerald-400"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-zinc-800 pt-4 text-sm text-zinc-500">
        <p>
          Rank <span className="font-medium text-white">#{stats.rank}</span> of {stats.rankOf}
        </p>
        <p>
          Break-even at <span className="font-medium text-white">{formatPrice(stats.breakEven)}</span>
        </p>
        <p>
          {stats.marginFloorPercent}% margin floor at{" "}
          <span className="font-medium text-white">{formatPrice(stats.marginFloorPrice)}</span>
        </p>
      </div>
    </section>
  );
};

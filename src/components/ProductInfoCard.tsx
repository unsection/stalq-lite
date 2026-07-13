import type { ReactNode } from "react";
import {
  ArrowUpRight,
  Clock,
  PencilSimple,
  SlidersHorizontal,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import { cn, formatPrice } from "@/lib/utils";

const MOCK_INFO = {
  sku: "LOGI-MX3S-WHT",
  name: "Logitech MX Master 3S",
  trackingLive: true,
  competitors: 8,
  updatedLabel: "updated 11h ago",
  cost: 56,
  yourPrice: 78.99,
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

export const ProductInfoCard = () => {
  const info = MOCK_INFO;

  return (
    <section className="rounded-3xl bg-zinc-900 p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium uppercase tracking-wide">
            <span className="text-zinc-500">{info.sku}</span>
            {info.trackingLive ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                Live tracking
              </span>
            ) : null}
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {info.name}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
            <UsersThree className="h-4 w-4" weight="duotone" />
            {info.competitors} competitors
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
            <Clock className="h-4 w-4" weight="duotone" />
            {info.updatedLabel}
          </span>
          <button
            type="button"
            aria-label={`Cost ${formatPrice(info.cost)}`}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
          >
            <SlidersHorizontal className="h-4 w-4 text-zinc-400" weight="duotone" />
            Cost {formatPrice(info.cost)}
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
            value={formatPrice(info.yourPrice)}
            hint="Listed on your store"
            dotClassName="bg-white"
          />
        </div>
        <div className="xl:border-l xl:border-zinc-800 xl:px-6">
          <StatColumn
            label="Lowest competitor"
            value={formatPrice(info.lowestCompetitor)}
            dotClassName="bg-zinc-500"
          >
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-400">
                <ArrowUpRight className="h-3 w-3" weight="bold" />
                {info.leadDeltaPercent}%
              </span>
              <span className="text-zinc-500">You hold the lead</span>
            </div>
          </StatColumn>
        </div>
        <div className="xl:border-l xl:border-zinc-800 xl:px-6">
          <StatColumn
            label="Current margin"
            value={`${info.currentMarginPercent}%`}
            hint={`${formatPrice(info.profitPerUnit)} profit per unit`}
            dotClassName="bg-emerald-400"
          />
        </div>
        <div className="xl:border-l xl:border-zinc-800 xl:pl-6">
          <StatColumn
            label="If you match lowest"
            value={`${info.matchLowestMarginPercent}%`}
            hint={`at ${formatPrice(info.matchLowestPrice)}`}
            dotClassName="bg-emerald-400"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-zinc-800 pt-4 text-sm text-zinc-500">
        <p>
          Rank <span className="font-medium text-white">#{info.rank}</span> of {info.rankOf}
        </p>
        <p>
          Break-even at <span className="font-medium text-white">{formatPrice(info.breakEven)}</span>
        </p>
        <p>
          {info.marginFloorPercent}% margin floor at{" "}
          <span className="font-medium text-white">{formatPrice(info.marginFloorPrice)}</span>
        </p>
      </div>
    </section>
  );
};

"use client";

import { format } from "date-fns";
import { useId, useState } from "react";
import {
  buildPriceHistoryStripDays,
  type PriceHistoryPoint,
  type StripDay,
  type StripDayStatus,
} from "@/lib/pricing/priceHistoryStrip";
import { cn, formatPrice } from "@/lib/utils";

type PriceHistoryStripProps = {
  history: PriceHistoryPoint[];
  yourPrice: number;
  competitorPrice: number | null;
  currency?: string;
  className?: string;
};

const barClassByStatus: Record<StripDayStatus, string> = {
  above: "bg-emerald-400",
  below: "bg-red-400",
  same: "bg-orange-400",
  none: "bg-zinc-700",
};

const statusLabel: Record<StripDayStatus, string> = {
  above: "Competitor above your price",
  below: "Competitor below your price",
  same: "Same as your price",
  none: "No price tracked",
};

const differenceToneClass: Record<Exclude<StripDayStatus, "none">, string> = {
  above: "text-emerald-600",
  below: "text-red-600",
  same: "text-orange-600",
};

const formatDifference = (day: StripDay, currency: string) => {
  if (day.status === "none" || day.difference == null) {
    return { label: "Difference", value: "No data", tone: "text-zinc-500" };
  }

  if (day.status === "same") {
    return {
      label: "Difference",
      value: `${formatPrice(0, currency)} (Same)`,
      tone: differenceToneClass.same,
    };
  }

  const absolute = formatPrice(Math.abs(day.difference), currency);

  if (day.status === "above") {
    return {
      label: "Difference",
      value: `+${absolute} above you`,
      tone: differenceToneClass.above,
    };
  }

  return {
    label: "Difference",
    value: `-${absolute} below you`,
    tone: differenceToneClass.below,
  };
};

const StripTooltip = ({
  day,
  currency,
}: {
  day: StripDay;
  currency: string;
}) => {
  const difference = formatDifference(day, currency);

  return (
    <div
      role="tooltip"
      className="w-52 rounded-xl border border-zinc-200 bg-white px-3.5 py-3 shadow-lg shadow-black/15"
    >
      <p className="text-sm font-semibold text-zinc-900">
        {format(day.date, "EEE, MMM d")}
      </p>
      <dl className="mt-2 space-y-1.5 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-zinc-500">Competitor</dt>
          <dd className="num font-semibold text-zinc-900">
            {formatPrice(day.competitorPrice, currency)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-zinc-500">Your price</dt>
          <dd className="num font-semibold text-zinc-900">
            {formatPrice(day.yourPrice, currency)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className={difference.tone}>{difference.label}</dt>
          <dd className={cn("num font-semibold", difference.tone)}>
            {difference.value}
          </dd>
        </div>
      </dl>
    </div>
  );
};

export const PriceHistoryStrip = ({
  history,
  yourPrice,
  competitorPrice,
  currency = "USD",
  className,
}: PriceHistoryStripProps) => {
  const labelId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const days = buildPriceHistoryStripDays(history, yourPrice);
  const activeDay = activeIndex == null ? null : days[activeIndex];

  const tooltipLeftPercent =
    activeIndex == null ? 50 : ((activeIndex + 0.5) / days.length) * 100;
  const tooltipOffset =
    tooltipLeftPercent < 18 ? "0%" : tooltipLeftPercent > 82 ? "-100%" : "-50%";

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-between gap-3">
        <p
          id={labelId}
          className="text-[11px] font-medium uppercase tracking-wide text-zinc-500"
        >
          Last 30 days
        </p>
        <p className="num text-xs text-zinc-500">
          {formatPrice(competitorPrice, currency)}
        </p>
      </div>

      <div
        className="relative mt-2"
        onMouseLeave={() => setActiveIndex(null)}
      >
        {activeDay ? (
          <div
            className="pointer-events-none absolute bottom-full z-20 mb-2"
            style={{
              left: `${tooltipLeftPercent}%`,
              transform: `translateX(${tooltipOffset})`,
            }}
          >
            <StripTooltip day={activeDay} currency={currency} />
          </div>
        ) : null}

        <div
          role="group"
          aria-labelledby={labelId}
          aria-label="Competitor price versus your price for the last 30 days"
          className="flex h-5 items-stretch gap-0.5"
        >
          {days.map((day, index) => (
            <button
              key={day.date.toISOString()}
              type="button"
              tabIndex={0}
              aria-label={`${format(day.date, "MMM d")}: ${statusLabel[day.status]}`}
              className={cn(
                "min-w-0 flex-1 rounded-full outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-[#0080FF]/70",
                barClassByStatus[day.status],
                activeIndex === index && "opacity-100",
                activeIndex != null && activeIndex !== index && "opacity-55",
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

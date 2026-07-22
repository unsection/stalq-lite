"use client";

import type { ReactNode } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { OwnProduct } from "@/db/schema";
import type { TrackerProduct } from "@/lib/pricing/getDashboardData";
import {
  buildHomePriceHistory,
  type HomePriceHistoryDatum,
} from "@/lib/pricing/homePriceHistory";
import { getBreakEvenPrice, getTargetMarginPrice } from "@/lib/pricing/margin";
import { formatPrice } from "@/lib/utils";

const YOUR_PRICE_COLOR = "#8b5cf6";
const CHEAPEST_PRICE_COLOR = "#f87171";
const BREAK_EVEN_COLOR = "#71717a";
const MARGIN_FLOOR_COLOR = "#34d399";

type HomePriceHistoryChartProps = {
  ownProduct: OwnProduct;
  competitors: TrackerProduct[];
};

type LegendItemProps = {
  color: string;
  label: ReactNode;
  dashed?: boolean;
  square?: boolean;
};

const LegendItem = ({ color, label, dashed = false, square = false }: LegendItemProps) => (
  <li className="flex items-center gap-2 whitespace-nowrap text-xs text-zinc-400 sm:text-sm">
    <span
      aria-hidden
      className={square ? "h-2.5 w-2.5 rounded-[2px]" : dashed ? "w-4 border-t border-dashed" : "h-2.5 w-2.5 rounded-full"}
      style={square || !dashed ? { backgroundColor: color } : { borderColor: color }}
    />
    <span>{label}</span>
  </li>
);

type DateAxisTickProps = {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string };
  labels: Map<string, string>;
  mobileVisibleKeys: Set<string>;
  todayKey: string;
};

const DateAxisTick = ({
  x = 0,
  y = 0,
  payload,
  labels,
  mobileVisibleKeys,
  todayKey,
}: DateAxisTickProps) => {
  const dateKey = payload?.value ?? "";
  const isToday = dateKey === todayKey;
  const label = labels.get(dateKey) ?? dateKey;

  return (
    <g
      className={mobileVisibleKeys.has(dateKey) ? undefined : "max-sm:hidden"}
      transform={`translate(${Number(x)}, ${Number(y)})`}
    >
      {isToday ? <rect x={-25} y={4} width={50} height={24} rx={12} fill="#fafafa" /> : null}
      <text
        x={0}
        y={20}
        textAnchor="middle"
        fill={isToday ? "#09090b" : "#71717a"}
        fontSize={12}
        fontWeight={isToday ? 600 : 400}
      >
        {label}
      </text>
    </g>
  );
};

type PriceTooltipProps = Pick<TooltipContentProps, "active" | "payload"> & {
  currency: string;
  breakEvenPrice: number | null;
  marginFloorPrice: number | null;
  targetMarginPercent: number;
};

const PriceTooltip = ({
  active,
  payload,
  currency,
  breakEvenPrice,
  marginFloorPrice,
  targetMarginPercent,
}: PriceTooltipProps) => {
  if (!active || payload.length === 0) return null;
  const point = payload.find((item) => item.payload)?.payload as HomePriceHistoryDatum | undefined;
  if (!point || point.isFuture) return null;

  return (
    <div className="min-w-60 rounded-xl border border-zinc-700 bg-zinc-950 p-3.5 shadow-2xl shadow-black/50">
      <p className="text-sm font-semibold text-white">{point.longDateLabel}</p>
      <dl className="mt-3 space-y-2 text-xs">
        <div className="flex items-start justify-between gap-5">
          <dt className="text-zinc-500">Cheapest competitor</dt>
          <dd className="text-right">
            <span className="num block font-semibold text-red-400">
              {formatPrice(point.cheapestPrice, currency)}
            </span>
            {point.cheapestCompetitorName ? (
              <span className="mt-0.5 block max-w-32 truncate text-zinc-500">
                {point.cheapestCompetitorName}
              </span>
            ) : null}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-5">
          <dt className="text-zinc-500">My price</dt>
          <dd className="num font-semibold text-violet-400">
            {formatPrice(point.yourPrice, currency)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-5">
          <dt className="text-zinc-500">Break-even</dt>
          <dd className="num font-semibold text-zinc-300">
            {formatPrice(breakEvenPrice, currency)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-5">
          <dt className="text-zinc-500">{targetMarginPercent}% margin floor</dt>
          <dd className="num font-semibold text-emerald-400">
            {formatPrice(marginFloorPrice, currency)}
          </dd>
        </div>
      </dl>
    </div>
  );
};

const formatPercent = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);

export const HomePriceHistoryChart = ({
  ownProduct,
  competitors,
}: HomePriceHistoryChartProps) => {
  const series = buildHomePriceHistory({ ownProduct, competitors });
  const currency = ownProduct.currency ?? "USD";
  const yourPrice = Number(ownProduct.price);
  const costPerUnit = Number(ownProduct.costPerUnit);
  const marketplaceFeePercent = Number(ownProduct.marketplaceFeePercent);
  const shippingCostPerUnit = Number(ownProduct.shippingCostPerUnit);
  const targetMarginPercent = Number(ownProduct.targetMarginPercent);
  const targetMarginLabel = formatPercent(targetMarginPercent);
  const breakEvenPrice = getBreakEvenPrice(
    costPerUnit,
    marketplaceFeePercent,
    shippingCostPerUnit,
  );
  const marginFloorPrice = getTargetMarginPrice(
    costPerUnit,
    marketplaceFeePercent,
    shippingCostPerUnit,
    targetMarginPercent,
  );
  const dateLabels = new Map(series.data.map((point) => [point.dateKey, point.dateLabel]));
  const todayIndex = series.data.findIndex((point) => point.isToday);
  const mobileVisibleKeys = new Set(
    [series.data[0], series.data[4], series.data[8], series.data[13]]
      .filter((point) => !point || todayIndex < 0 || Math.abs(series.data.indexOf(point) - todayIndex) > 1)
      .map((point) => point?.dateKey)
      .concat(series.todayKey)
      .filter((dateKey): dateKey is string => Boolean(dateKey)),
  );
  const compatiblePrices = series.data
    .map((point) => point.cheapestPrice)
    .filter((price): price is number => price != null);
  const domainValues = [yourPrice, breakEvenPrice, marginFloorPrice, ...compatiblePrices].filter(
    (price): price is number => price != null && Number.isFinite(price),
  );
  const domainMinimum = Math.min(...domainValues);
  const domainMaximum = Math.max(...domainValues);
  const domainPadding = Math.max((domainMaximum - domainMinimum) * 0.18, 1);
  const yDomain: [number, number] = [
    Math.max(0, domainMinimum - domainPadding),
    domainMaximum + domainPadding,
  ];
  const validPointCount = compatiblePrices.length;
  const headingId = `price-history-${ownProduct.id}`;
  const summaryId = `${headingId}-summary`;
  const currentCheapest = [...series.data]
    .reverse()
    .find((point) => !point.isFuture && point.cheapestPrice != null);
  const accessibilitySummary = currentCheapest
    ? `Your current price is ${formatPrice(yourPrice, currency)}. The latest cheapest competitor is ${currentCheapest.cheapestCompetitorName} at ${formatPrice(currentCheapest.cheapestPrice, currency)}. Break-even is ${formatPrice(breakEvenPrice, currency)} and the ${targetMarginLabel}% margin floor is ${formatPrice(marginFloorPrice, currency)}.`
    : `Your current price is ${formatPrice(yourPrice, currency)}. No compatible competitor price history is available. Break-even is ${formatPrice(breakEvenPrice, currency)} and the ${targetMarginLabel}% margin floor is ${formatPrice(marginFloorPrice, currency)}.`;

  const emptyMessage =
    competitors.length === 0
      ? "Add a competitor below to start comparing prices."
      : series.matchingCompetitorCount === 0
        ? "Competitor prices use a different currency and cannot be compared."
        : "Price history will appear after the first successful check.";

  return (
    <section className="rounded-3xl bg-zinc-900 p-5 sm:p-6" aria-labelledby={headingId}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
            {series.mode === "first" ? "First 14 days" : "Last 14 days"} · {series.rangeLabel}
          </p>
          <h2 id={headingId} className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Price history
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Your price vs the cheapest competitor</p>
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-2 xl:justify-end" aria-label="Chart legend">
          <LegendItem color={YOUR_PRICE_COLOR} label="My price" />
          <LegendItem color={CHEAPEST_PRICE_COLOR} label="Cheapest competitor" />
          <LegendItem
            color={BREAK_EVEN_COLOR}
            dashed
            label={`Break-even ${formatPrice(breakEvenPrice, currency)}`}
          />
          <LegendItem
            color={MARGIN_FLOOR_COLOR}
            square
            label={`${targetMarginLabel}% margin floor ${formatPrice(marginFloorPrice, currency)}`}
          />
        </ul>
      </div>

      {series.mismatchedCurrencyCount > 0 && series.matchingCompetitorCount > 0 ? (
        <p className="mt-4 text-xs text-amber-400">
          {series.mismatchedCurrencyCount} competitor price
          {series.mismatchedCurrencyCount === 1 ? " was" : "s were"} excluded because the currency does not match {currency}.
        </p>
      ) : null}

      <p id={summaryId} className="sr-only">{accessibilitySummary}</p>

      {series.hasCompatibleHistory ? (
        <div
          className="mt-5 h-[280px] rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#0080FF]/70 sm:mt-7 sm:h-[360px]"
          role="img"
          tabIndex={0}
          aria-label={`Fourteen-day price history for ${ownProduct.name}`}
          aria-describedby={summaryId}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              accessibilityLayer
              data={series.data}
              margin={{ top: 12, right: 8, bottom: 4, left: 8 }}
            >
              <CartesianGrid
                horizontal={false}
                stroke="#3f3f46"
                strokeDasharray="3 6"
                strokeOpacity={0.55}
              />
              <XAxis
                dataKey="dateKey"
                axisLine={false}
                tickLine={false}
                interval={0}
                minTickGap={18}
                padding={{ left: 16, right: 16 }}
                tickMargin={10}
                height={36}
                tick={(props) => (
                  <DateAxisTick
                    {...props}
                    labels={dateLabels}
                    mobileVisibleKeys={mobileVisibleKeys}
                    todayKey={series.todayKey}
                  />
                )}
              />
              <YAxis hide domain={yDomain} />
              <Tooltip
                content={(props) => (
                  <PriceTooltip
                    {...props}
                    currency={currency}
                    breakEvenPrice={breakEvenPrice}
                    marginFloorPrice={marginFloorPrice}
                    targetMarginPercent={targetMarginPercent}
                  />
                )}
                cursor={{ stroke: "#a1a1aa", strokeWidth: 1 }}
                isAnimationActive={false}
              />
              <ReferenceLine
                y={breakEvenPrice ?? undefined}
                stroke={BREAK_EVEN_COLOR}
                strokeDasharray="5 6"
                strokeOpacity={0.9}
                label={{
                  value: `Break-even ${formatPrice(breakEvenPrice, currency)}`,
                  position: "insideBottomRight",
                  className: "hidden sm:block",
                  fill: "#a1a1aa",
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                y={marginFloorPrice ?? undefined}
                stroke={MARGIN_FLOOR_COLOR}
                strokeDasharray="2 5"
                strokeOpacity={0.9}
                label={{
                  value: `${targetMarginLabel}% margin floor`,
                  position: "insideTopRight",
                  className: "hidden sm:block",
                  fill: MARGIN_FLOOR_COLOR,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <ReferenceLine
                x={series.todayKey}
                stroke="#d4d4d8"
                strokeWidth={1}
                strokeOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="cheapestPrice"
                fill={CHEAPEST_PRICE_COLOR}
                fillOpacity={0.09}
                stroke="none"
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="cheapestPrice"
                name="Cheapest competitor"
                stroke={CHEAPEST_PRICE_COLOR}
                strokeWidth={2.5}
                dot={validPointCount === 1 ? { r: 3, fill: CHEAPEST_PRICE_COLOR } : false}
                activeDot={{ r: 4, fill: CHEAPEST_PRICE_COLOR, stroke: "#18181b", strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="yourPrice"
                name="My price"
                stroke={YOUR_PRICE_COLOR}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: YOUR_PRICE_COLOR, stroke: "#18181b", strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-5 flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-zinc-700/80 bg-black/10 px-6 text-center sm:mt-7 sm:h-[360px]">
          <p className="max-w-sm text-sm text-zinc-500">{emptyMessage}</p>
        </div>
      )}

      <div className="sr-only overflow-hidden">
        <table>
          <caption>Daily price history for {ownProduct.name}</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">My price</th>
              <th scope="col">Cheapest competitor</th>
              <th scope="col">Competitor name</th>
            </tr>
          </thead>
          <tbody>
            {series.data.map((point) => (
              <tr key={point.dateKey}>
                <th scope="row">{point.longDateLabel}</th>
                <td>{point.isFuture ? "Future date" : formatPrice(point.yourPrice, currency)}</td>
                <td>{formatPrice(point.cheapestPrice, currency)}</td>
                <td>{point.cheapestCompetitorName ?? "No compatible price"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

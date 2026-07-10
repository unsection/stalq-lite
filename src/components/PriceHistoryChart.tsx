"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { ACCENT_BLUE } from "@/lib/constants";

type PricePoint = {
  scrapedAt: string | Date;
  price: string | number;
};

type PriceHistoryChartProps = {
  data: PricePoint[];
};

export const PriceHistoryChart = ({ data }: PriceHistoryChartProps) => {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-zinc-900 bg-zinc-950 text-sm text-zinc-500">
        No price history yet. Run a scrape to populate this chart.
      </div>
    );
  }

  const chartData = data.map((point) => ({
    date: format(new Date(point.scrapedAt), "MMM d"),
    price: Number(point.price),
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1f2937" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#71717a", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: "#0a0a0a",
              border: "1px solid #27272a",
              borderRadius: 8,
              color: "#fafafa",
            }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Price"]}
          />
          <Bar dataKey="price" fill={ACCENT_BLUE} radius={[2, 2, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

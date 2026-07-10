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
import { format, parseISO } from "date-fns";
import { ACCENT_BLUE } from "@/lib/constants";

type SeriesPoint = {
  bucket: string;
  count: number;
};

type LogsActivityChartProps = {
  data: SeriesPoint[];
};

export const LogsActivityChart = ({ data }: LogsActivityChartProps) => {
  const chartData = data.map((point) => ({
    label: format(parseISO(point.bucket), "MMM d"),
    count: point.count,
  }));

  return (
    <div className="h-52 w-full border-b border-zinc-900 pb-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1f2937" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#71717a", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0a0a0a",
              border: "1px solid #27272a",
              borderRadius: 8,
              color: "#fafafa",
            }}
            formatter={(value) => [value, "Scrapes"]}
          />
          <Bar dataKey="count" fill={ACCENT_BLUE} radius={[2, 2, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

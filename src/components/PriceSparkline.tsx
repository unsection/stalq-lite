"use client";

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { cn } from "@/lib/utils";

type PriceSparklineProps = {
  data: number[];
  direction: "up" | "down" | "flat" | "unknown";
  className?: string;
};

const strokeForDirection = {
  up: "#f87171",
  down: "#34d399",
  flat: "#71717a",
  unknown: "#3f3f46",
};

export const PriceSparkline = ({ data, direction, className }: PriceSparklineProps) => {
  if (data.length < 2) {
    return (
      <div
        className={cn(
          "flex h-10 w-24 items-center justify-center text-xs text-zinc-600",
          className,
        )}
      >
        —
      </div>
    );
  }

  const chartData = data.map((price, index) => ({ index, price }));
  const min = Math.min(...data);
  const max = Math.max(...data);
  const padding = max === min ? 1 : 0;

  return (
    <div className={cn("h-10 w-24", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 4 }}>
          <YAxis hide domain={[min - padding, max + padding]} />
          <Line
            type="monotone"
            dataKey="price"
            stroke={strokeForDirection[direction]}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

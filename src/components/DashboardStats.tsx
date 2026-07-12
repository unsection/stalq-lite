import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Package,
} from "@phosphor-icons/react/dist/ssr";
import type { DashboardSummary } from "@/lib/pricing/movement";
import { cn } from "@/lib/utils";

type DashboardStatsProps = {
  summary: DashboardSummary;
};

const StatCard = ({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: string;
}) => (
  <div className="rounded-lg border border-zinc-900 bg-zinc-950 px-4 py-4">
    <div className="flex items-center justify-between">
      <p className="text-sm text-zinc-500">{label}</p>
      <span className={cn("text-zinc-500", accent)}>{icon}</span>
    </div>
    <p className={cn("num mt-2 text-2xl font-semibold text-white", accent)}>{value}</p>
  </div>
);

export const DashboardStats = ({ summary }: DashboardStatsProps) => {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        label="Tracked"
        value={summary.total}
        icon={<Package className="h-4 w-4" weight="duotone" />}
      />
      <StatCard
        label="Price drops"
        value={summary.drops}
        icon={<ArrowDownRight className="h-4 w-4" weight="duotone" />}
        accent="text-emerald-400"
      />
      <StatCard
        label="Price increases"
        value={summary.increases}
        icon={<ArrowUpRight className="h-4 w-4" weight="duotone" />}
        accent="text-red-400"
      />
      <StatCard
        label="Unchanged"
        value={summary.stable}
        icon={<Minus className="h-4 w-4" weight="duotone" />}
        accent="text-zinc-400"
      />
      <StatCard
        label="No price yet"
        value={summary.unscrape}
        icon={<Minus className="h-4 w-4" weight="duotone" />}
        accent="text-zinc-600"
      />
    </div>
  );
};

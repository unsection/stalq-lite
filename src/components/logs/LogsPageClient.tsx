"use client";

import { ChevronDown, Filter, MoreHorizontal, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { DATE_RANGE_OPTIONS } from "@/lib/constants";
import { LogsActivityChart } from "@/components/logs/LogsActivityChart";
import { LogsTable, type LogRow } from "@/components/logs/LogsTable";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type LogsPageClientProps = {
  logs: LogRow[];
  series: Array<{ bucket: string; count: number }>;
  range: string;
  tab: string;
};

const tabs = [
  { id: "scrapes", label: "Scrapes" },
  { id: "price_changes", label: "Price Changes" },
  { id: "errors", label: "Errors" },
] as const;

export const LogsPageClient = ({ logs, series, range, tab }: LogsPageClientProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showRangeMenu, setShowRangeMenu] = useState(false);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => params.set(key, value));
    startTransition(() => {
      router.push(`/logs?${params.toString()}`);
    });
  };

  const currentRangeLabel =
    DATE_RANGE_OPTIONS.find((option) => option.value === range)?.label ?? "Past 1 Month";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Logs</h1>
          <p className="mt-1 text-sm text-zinc-500">View your scrape logs and history.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => router.refresh()}
            aria-label="Refresh logs"
            disabled={isPending}
          >
            <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
          </Button>
          <Button variant="ghost" aria-label="Filter logs">
            <Filter className="h-4 w-4" />
          </Button>
          <div className="relative">
            <Button
              variant="secondary"
              onClick={() => setShowRangeMenu((open) => !open)}
              aria-haspopup="listbox"
              aria-expanded={showRangeMenu}
            >
              {currentRangeLabel}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            {showRangeMenu ? (
              <div className="absolute right-0 z-20 mt-2 w-44 rounded-md border border-zinc-800 bg-zinc-950 py-1 shadow-xl">
                {DATE_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-900"
                    onClick={() => {
                      setShowRangeMenu(false);
                      updateParams({ range: option.value });
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <Button variant="ghost" aria-label="More options">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="border-b border-zinc-900">
        <div className="flex items-center gap-6">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateParams({ tab: item.id })}
              className={cn(
                "border-b-2 px-1 pb-3 text-sm transition-colors",
                tab === item.id
                  ? "border-[#0080FF] text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <LogsActivityChart data={series} />
      <LogsTable logs={logs} />
    </div>
  );
};

"use client";

import { format } from "date-fns";
import { Code, Key } from "@phosphor-icons/react";
import { useState } from "react";
import type { ScrapeLog } from "@/db/schema";
import { formatDuration, formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ScrapedHtmlModal } from "@/components/logs/ScrapedHtmlModal";

export type LogRow = Omit<ScrapeLog, "scrapeResponse"> & {
  productName: string;
  productDomain: string;
  productUrl: string;
  hasScrapeResponse: boolean;
};

type LogsTableProps = {
  logs: LogRow[];
};

const statusStyles: Record<ScrapeLog["status"], string> = {
  success: "text-emerald-400",
  error: "text-red-400",
  timeout: "text-amber-400",
  no_price: "text-zinc-400",
};

export const LogsTable = ({ logs }: LogsTableProps) => {
  const [viewingLog, setViewingLog] = useState<LogRow | null>(null);

  if (logs.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-zinc-500">
        No logs in this range yet.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead className="border-b border-zinc-900 text-left text-zinc-500">
            <tr>
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-3 py-3 font-medium">Product</th>
              <th className="px-3 py-3 font-medium">Domain</th>
              <th className="px-3 py-3 font-medium text-right">Price</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium text-right">Duration</th>
              <th className="px-3 py-3 font-medium text-right">Credits</th>
              <th className="px-3 py-3 font-medium">Country</th>
              <th className="px-3 py-3 font-medium">Finish Reason</th>
              <th className="px-3 py-3 font-medium">API Key</th>
              <th className="px-3 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const screenshotUrl =
                log.finishReason === "screenshot_captured"
                  ? log.errorMessage?.replace(/^Screenshot captured:\s*/, "")
                  : null;
              return (
                <tr key={log.id} className="border-b border-zinc-900/80 hover:bg-zinc-950/50">
                  <td className="px-3 py-3 text-zinc-300">
                    {format(new Date(log.createdAt), "MMM d, hh:mm a")}
                  </td>
                  <td className="px-3 py-3 text-zinc-200">{log.productName}</td>
                  <td className="px-3 py-3 text-zinc-400">{log.productDomain}</td>
                  <td className="num px-3 py-3 text-right text-zinc-200">
                    {log.price
                      ? formatPrice(Number(log.price), log.currency ?? "USD")
                      : "—"}
                  </td>
                  <td className={cn("px-3 py-3 capitalize", statusStyles[log.status])}>
                    {log.status.replace("_", " ")}
                  </td>
                  <td className="num px-3 py-3 text-right text-zinc-400">
                    {formatDuration(log.durationMs)}
                  </td>
                  <td className="num px-3 py-3 text-right text-zinc-400">
                    {log.creditsConsumed ?? "—"}
                  </td>
                  <td className="px-3 py-3 uppercase text-zinc-500">
                    {log.country || "—"}
                  </td>
                  <td className="px-3 py-3 text-zinc-400">
                    {screenshotUrl && /^https?:\/\//.test(screenshotUrl) ? (
                      <a
                        href={screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-zinc-300 underline hover:text-white"
                      >
                        Open screenshot
                      </a>
                    ) : (
                      log.finishReason ?? "—"
                    )}
                  </td>
                  <td className="px-3 py-3 text-zinc-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Key className="h-3.5 w-3.5" />
                      Context.dev
                    </span>
                  </td>
                  <td className="px-3 py-3 text-zinc-500">
                    {log.hasScrapeResponse ? (
                      <button
                        type="button"
                        aria-label={`View scrape response JSON for ${log.productName}`}
                        onClick={() => setViewingLog(log)}
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-900 hover:text-[#0080FF]"
                      >
                        <Code className="h-4 w-4" weight="bold" />
                      </button>
                    ) : (
                      <span className="inline-block w-6" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ScrapedHtmlModal
        open={Boolean(viewingLog)}
        logId={viewingLog?.id ?? null}
        productLabel={
          viewingLog ? `${viewingLog.productName} · ${viewingLog.productDomain}` : ""
        }
        onClose={() => setViewingLog(null)}
      />
    </>
  );
};

"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowDownRight,
  ArrowSquareOut,
  ArrowUpRight,
  ArrowsClockwise,
  Minus,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { TrackerProduct } from "@/lib/pricing/getDashboardData";
import { Button } from "@/components/ui/Button";
import { PriceSparkline } from "@/components/PriceSparkline";
import { cn, formatPrice } from "@/lib/utils";

type PriceTrackerTableProps = {
  products: TrackerProduct[];
};

type SortKey = "name" | "price" | "change" | "lastScraped";

const MovementBadge = ({
  direction,
  change,
  changePercent,
  currency,
}: {
  direction: TrackerProduct["movement"]["direction"];
  change: number | null;
  changePercent: number | null;
  currency: string;
}) => {
  if (direction === "unknown" || change == null) {
    return <span className="text-zinc-600">—</span>;
  }

  if (direction === "flat") {
    return (
      <span className="inline-flex items-center gap-1 text-zinc-500">
        <Minus className="h-3.5 w-3.5" />
        <span className="num text-xs">0%</span>
      </span>
    );
  }

  const isDown = direction === "down";
  const Icon = isDown ? ArrowDownRight : ArrowUpRight;
  const color = isDown ? "text-emerald-400" : "text-red-400";
  const sign = change > 0 ? "+" : "";

  return (
    <div className={cn("inline-flex flex-col items-end gap-0.5", color)}>
      <span className="inline-flex items-center gap-1 font-medium">
        <Icon className="h-3.5 w-3.5" />
        <span className="num text-sm">
          {sign}
          {formatPrice(Math.abs(change), currency)}
        </span>
      </span>
      {changePercent != null ? (
        <span className="num text-xs opacity-80">
          {sign}
          {Math.abs(changePercent).toFixed(1)}%
        </span>
      ) : null}
    </div>
  );
};

export const PriceTrackerTable = ({ products }: PriceTrackerTableProps) => {
  const router = useRouter();
  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("change");
  const [sortAsc, setSortAsc] = useState(false);

  const handleScrape = async (productId: string) => {
    setScrapingId(productId);
    try {
      const response = await fetch(`/api/products/${productId}/scrape`, { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message ?? "Scrape failed");
      }
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Scrape failed");
    } finally {
      setScrapingId(null);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((value) => !value);
      return;
    }
    setSortKey(key);
    setSortAsc(key === "name");
  };

  const sortedProducts = useMemo(() => {
    const rows = [...products];
    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "price":
          cmp = (a.movement.current ?? 0) - (b.movement.current ?? 0);
          break;
        case "change":
          cmp = (a.movement.change ?? 0) - (b.movement.change ?? 0);
          break;
        case "lastScraped":
          cmp =
            new Date(a.lastScrapedAt ?? 0).getTime() -
            new Date(b.lastScrapedAt ?? 0).getTime();
          break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return rows;
  }, [products, sortAsc, sortKey]);

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-900 bg-zinc-950 px-6 py-16 text-center">
        <h2 className="text-lg font-medium text-white">No products tracked yet</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Add product URLs to start monitoring price movement.
        </p>
        <Link
          href="/products/new"
          className="mt-6 inline-flex rounded-md bg-[#0080FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0066cc]"
        >
          Add product
        </Link>
      </div>
    );
  }

  const SortHeader = ({ label, column }: { label: string; column: SortKey }) => (
    <button
      type="button"
      onClick={() => handleSort(column)}
      className="font-medium hover:text-zinc-300"
    >
      {label}
      {sortKey === column ? (sortAsc ? " ↑" : " ↓") : ""}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-900">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-900 bg-zinc-950 text-left text-zinc-500">
          <tr>
            <th className="px-4 py-3">
              <SortHeader label="Product" column="name" />
            </th>
            <th className="px-4 py-3 text-right">
              <SortHeader label="Price" column="price" />
            </th>
            <th className="px-4 py-3 text-right">
              <SortHeader label="Change" column="change" />
            </th>
            <th className="px-4 py-3">Trend</th>
            <th className="px-4 py-3 text-right">Low</th>
            <th className="px-4 py-3 text-right">High</th>
            <th className="px-4 py-3">
              <SortHeader label="Last checked" column="lastScraped" />
            </th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedProducts.map((product) => {
            const { movement } = product;
            const currency = product.currency ?? "USD";

            return (
              <tr
                key={product.id}
                className="border-b border-zinc-900/80 hover:bg-zinc-950/60"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/products/${product.id}`}
                    className="font-medium text-white hover:underline"
                  >
                    {product.name}
                  </Link>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                    <span>{product.domain}</span>
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 hover:text-zinc-300"
                      aria-label={`Open ${product.name}`}
                    >
                      <ArrowSquareOut className="h-3 w-3" />
                    </a>
                  </div>
                </td>
                <td className="num px-4 py-3 text-right text-base font-medium text-white">
                  {formatPrice(movement.current, currency)}
                </td>
                <td className="px-4 py-3 text-right">
                  <MovementBadge
                    direction={movement.direction}
                    change={movement.change}
                    changePercent={movement.changePercent}
                    currency={currency}
                  />
                </td>
                <td className="px-4 py-3">
                  <PriceSparkline
                    data={movement.sparkline}
                    direction={movement.direction}
                  />
                </td>
                <td className="num px-4 py-3 text-right text-zinc-400">
                  {formatPrice(movement.low, currency)}
                </td>
                <td className="num px-4 py-3 text-right text-zinc-400">
                  {formatPrice(movement.high, currency)}
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {product.lastScrapedAt
                    ? formatDistanceToNow(new Date(product.lastScrapedAt), { addSuffix: true })
                    : "Never"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => handleScrape(product.id)}
                      disabled={scrapingId === product.id}
                      aria-label={`Scrape ${product.name}`}
                    >
                      <ArrowsClockwise
                        className={`mr-1.5 h-3.5 w-3.5 ${scrapingId === product.id ? "animate-spin" : ""}`}
                      />
                      {scrapingId === product.id ? "..." : "Scrape"}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

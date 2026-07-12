"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowDownRight,
  ArrowSquareOut,
  ArrowUpRight,
  ArrowsClockwise,
  DotsThree,
  Eye,
  Trash,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TrackerProduct } from "@/lib/pricing/getDashboardData";
import {
  cn,
  formatPrice,
  getFaviconUrl,
  mockInStock,
  mockMarginPercent,
} from "@/lib/utils";

type PriceTrackerTableProps = {
  products: TrackerProduct[];
};

type SortKey = "name" | "price" | "change" | "lastScraped";

const PriceChange = ({
  direction,
  change,
  currency,
}: {
  direction: TrackerProduct["movement"]["direction"];
  change: number | null;
  currency: string;
}) => {
  if (direction === "unknown" || direction === "flat" || change == null || change === 0) {
    return null;
  }

  const isDown = direction === "down";
  const Icon = isDown ? ArrowDownRight : ArrowUpRight;
  const color = isDown ? "text-emerald-400" : "text-red-400";
  const sign = change > 0 ? "+" : "";

  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-medium", color)}>
      <Icon className="h-4 w-4" weight="bold" />
      <span className="num">
        {sign}
        {formatPrice(Math.abs(change), currency)}
      </span>
    </span>
  );
};

const menuItemClass =
  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50";

const ProductCard = ({
  product,
  isScraping,
  isDeleting,
  onScrape,
  onDelete,
}: {
  product: TrackerProduct;
  isScraping: boolean;
  isDeleting: boolean;
  onScrape: (productId: string) => void;
  onDelete: (productId: string) => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { movement } = product;
  const currency = product.currency ?? "USD";
  const margin = mockMarginPercent(product.id);
  const inStock = mockInStock(product.id);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleScrapeClick = () => {
    setMenuOpen(false);
    onScrape(product.id);
  };

  const handleDeleteClick = () => {
    setMenuOpen(false);
    onDelete(product.id);
  };

  return (
    <article className="flex flex-col rounded-xl bg-zinc-900 p-4 transition-colors hover:bg-zinc-900/80">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getFaviconUrl(product.domain)}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6"
            loading="lazy"
          />
        </div>

        <div className="min-w-0 flex-1 leading-none">
          <Link
            href={`/products/${product.id}`}
            className="line-clamp-1 font-medium leading-none text-white hover:underline"
          >
            {product.name}
          </Link>
          <p className="truncate text-xs leading-none text-zinc-500">{product.domain}</p>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
            aria-label={`Actions for ${product.name}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <DotsThree className="h-5 w-5" weight="bold" />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-xl bg-zinc-950 py-1.5 shadow-xl shadow-black/40"
            >
              <Link
                href={`/products/${product.id}`}
                role="menuitem"
                className={menuItemClass}
                onClick={() => setMenuOpen(false)}
              >
                <Eye className="h-4 w-4 shrink-0" />
                View Details
              </Link>
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                className={menuItemClass}
                onClick={() => setMenuOpen(false)}
              >
                <ArrowSquareOut className="h-4 w-4 shrink-0" />
                Visit
              </a>
              <button
                type="button"
                role="menuitem"
                onClick={handleScrapeClick}
                disabled={isScraping}
                className={menuItemClass}
              >
                <ArrowsClockwise
                  className={cn("h-4 w-4 shrink-0", isScraping && "animate-spin")}
                />
                {isScraping ? "Refreshing…" : "Refresh"}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 disabled:opacity-50"
              >
                <Trash className="h-4 w-4 shrink-0" />
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex items-baseline gap-2.5">
        <p className="num text-2xl font-semibold tracking-tight text-white">
          {formatPrice(movement.current, currency)}
        </p>
        <PriceChange
          direction={movement.direction}
          change={movement.change}
          currency={currency}
        />
      </div>

      <p className="mt-2">
        <span className="inline-flex rounded-full bg-emerald-950/80 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-900/60">
          {margin.toFixed(1)}% margin at their price
        </span>
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
            inStock
              ? "bg-zinc-800 text-zinc-300 ring-zinc-700"
              : "bg-red-950/50 text-red-400 ring-red-900/50",
          )}
        >
          {inStock ? "In stock" : "Out of stock"}
        </span>
        <span className="truncate text-xs text-zinc-600">
          {product.lastScrapedAt
            ? formatDistanceToNow(new Date(product.lastScrapedAt), { addSuffix: true })
            : "Never checked"}
        </span>
      </div>
    </article>
  );
};

export const PriceTrackerTable = ({ products }: PriceTrackerTableProps) => {
  const router = useRouter();
  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  const handleDelete = async (productId: string) => {
    if (!confirm("Delete this product and all scrape history?")) return;
    setDeletingId(productId);
    try {
      const response = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete product");
      }
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSortChange = (value: string) => {
    const [key, direction] = value.split(":") as [SortKey, "asc" | "desc"];
    setSortKey(key);
    setSortAsc(direction === "asc");
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
      <div className="rounded-xl border border-zinc-900 bg-zinc-950 px-6 py-16 text-center">
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

  const sortValue = `${sortKey}:${sortAsc ? "asc" : "desc"}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {products.length} product{products.length === 1 ? "" : "s"}
        </p>
        <label className="flex items-center gap-2 text-sm text-zinc-500">
          <span className="sr-only">Sort by</span>
          <select
            value={sortValue}
            onChange={(event) => handleSortChange(event.target.value)}
            className="rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-sm text-zinc-300 outline-none hover:border-zinc-700 focus:border-zinc-600"
            aria-label="Sort products"
          >
            <option value="change:desc">Biggest change</option>
            <option value="change:asc">Smallest change</option>
            <option value="price:desc">Price high → low</option>
            <option value="price:asc">Price low → high</option>
            <option value="name:asc">Name A → Z</option>
            <option value="lastScraped:desc">Recently checked</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isScraping={scrapingId === product.id}
            isDeleting={deletingId === product.id}
            onScrape={handleScrape}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

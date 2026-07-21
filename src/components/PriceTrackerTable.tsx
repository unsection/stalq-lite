"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowDownRight,
  ArrowSquareOut,
  ArrowUpRight,
  ArrowsClockwise,
  CircleNotch,
  DotsThree,
  Eye,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TrackerProduct } from "@/lib/pricing/getDashboardData";
import type { OwnProduct, Product } from "@/db/schema";
import { calculateMargin } from "@/lib/pricing/margin";
import { UNREGISTERED_SITE_SCRAPE_DEFAULTS } from "@/lib/scrape/defaultScrapeSettings";
import {
  cn,
  extractDomain,
  formatPrice,
  getFaviconUrl,
  mockInStock,
} from "@/lib/utils";
import { PriceHistoryStrip } from "@/components/PriceHistoryStrip";
import { TrackCompetitorModal } from "@/components/TrackCompetitorModal";

type PriceTrackerTableProps = {
  products: TrackerProduct[];
  ownProduct: OwnProduct;
};

type SortKey = "name" | "price" | "change" | "lastScraped";

type PendingCompetitor = Pick<Product, "id" | "name" | "url" | "domain">;

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

const ScrapingCompetitorCard = ({
  domain,
  url,
  isDeleting,
  onDelete,
}: {
  domain: string;
  url: string;
  isDeleting: boolean;
  onDelete: () => void;
}) => {
  return (
    <article className="flex min-h-52 flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
          <CircleNotch className="h-5 w-5 animate-spin text-zinc-500" weight="bold" />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="line-clamp-1 font-medium leading-tight text-white">{domain}</p>
          <p className="truncate text-xs leading-tight text-zinc-500">{url}</p>
        </div>

        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          aria-label={`Delete competitor ${domain}`}
          className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-50"
        >
          <Trash className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1" />

      <div className="mt-4 flex items-center gap-2 border-t border-zinc-800 pt-3">
        <CircleNotch className="h-3.5 w-3.5 animate-spin text-zinc-500" weight="bold" />
        <span className="text-sm text-zinc-500">Scraping page...</span>
      </div>
    </article>
  );
};

const ProductCard = ({
  product,
  isScraping,
  isDeleting,
  ownProduct,
  onScrape,
  onDelete,
}: {
  product: TrackerProduct;
  isScraping: boolean;
  isDeleting: boolean;
  ownProduct: OwnProduct;
  onScrape: (productId: string) => void;
  onDelete: (productId: string) => void;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { movement } = product;
  const currency = product.currency ?? "USD";
  const margin = calculateMargin({
    price: product.movement.current ?? 0,
    costPerUnit: Number(ownProduct.costPerUnit),
    marketplaceFeePercent: Number(ownProduct.marketplaceFeePercent),
    shippingCostPerUnit: Number(ownProduct.shippingCostPerUnit),
  });
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

  if (isScraping) {
    return (
      <ScrapingCompetitorCard
        domain={product.domain}
        url={product.url}
        isDeleting={isDeleting}
        onDelete={() => onDelete(product.id)}
      />
    );
  }

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
      <div className="flex items-center gap-3">
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

        <div className="min-w-0 flex-1 space-y-1">
          <Link
            href={`/products/${product.id}`}
            className="line-clamp-1 font-medium leading-tight text-white hover:underline"
          >
            {product.name}
          </Link>
          <p className="truncate text-xs leading-tight text-zinc-500">{product.domain}</p>
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
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
            margin.marginPercent < 5
              ? "bg-red-950/80 text-red-400 ring-red-900/60"
              : "bg-emerald-950/80 text-emerald-400 ring-emerald-900/60",
          )}
        >
          {margin.marginPercent.toFixed(1)}% margin at their price
        </span>
      </p>

      <PriceHistoryStrip
        className="mt-4"
        history={product.history.map((point) => ({
          price: point.price,
          scrapedAt: new Date(point.scrapedAt),
        }))}
        yourPrice={Number(ownProduct.price)}
        competitorPrice={movement.current}
        currency={currency}
      />

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

export const PriceTrackerTable = ({ products, ownProduct }: PriceTrackerTableProps) => {
  const router = useRouter();
  const [trackOpen, setTrackOpen] = useState(false);
  const [pending, setPending] = useState<PendingCompetitor[]>([]);
  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("change");
  const [sortAsc, setSortAsc] = useState(false);

  // Drop pending placeholders once the server list includes them (after refresh).
  useEffect(() => {
    const ids = new Set(products.map((product) => product.id));
    setPending((current) => current.filter((item) => !ids.has(item.id)));
  }, [products]);

  const runScrape = async (productId: string) => {
    setScrapingId(productId);
    try {
      const response = await fetch(`/api/products/${productId}/scrape`, { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message ?? "Scrape failed");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Scrape failed");
    } finally {
      setScrapingId(null);
      router.refresh();
    }
  };

  const handleScrape = async (productId: string) => {
    await runScrape(productId);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Delete this product and all scrape history?")) return;
    setDeletingId(productId);
    try {
      const response = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete product");
      }
      setPending((current) => current.filter((item) => item.id !== productId));
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddCompetitor = async (url: string) => {
    const domain = extractDomain(url);
    const defaults = UNREGISTERED_SITE_SCRAPE_DEFAULTS;

    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownProductId: ownProduct.id,
        name: domain,
        url,
        useMainContentOnly: defaults.useMainContentOnly,
        settleAnimations: defaults.settleAnimations,
        includeSelectors: defaults.includeSelectors,
        excludeSelectors: defaults.excludeSelectors,
        country: defaults.country,
        waitForMs: defaults.waitForMs,
        timeoutEnabled: defaults.timeoutEnabled,
        timeoutMs: defaults.timeoutMs,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message ?? "Failed to add competitor");
    }

    const created = data as Product;
    setPending((current) => [
      ...current,
      { id: created.id, name: created.name, url: created.url, domain: created.domain },
    ]);

    void runScrape(created.id);
  };

  const handleSortChange = (value: string) => {
    const [key, direction] = value.split(":") as [SortKey, "asc" | "desc"];
    setSortKey(key);
    setSortAsc(direction === "asc");
  };

  const pendingIds = useMemo(() => new Set(pending.map((item) => item.id)), [pending]);

  const displayedProducts = useMemo(() => {
    const rows = products.filter((product) => !pendingIds.has(product.id));
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
  }, [products, sortAsc, sortKey, pendingIds]);

  const sortValue = `${sortKey}:${sortAsc ? "asc" : "desc"}`;
  const competitorCount = displayedProducts.length + pending.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Competitors</h2>
          <p className="text-sm text-zinc-500">{competitorCount} tracked for {ownProduct.name}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-500">
          <span className="sr-only">Sort by</span>
          <select
            value={sortValue}
            onChange={(event) => handleSortChange(event.target.value)}
            className="bg-transparent px-0 py-1.5 text-sm text-zinc-300 outline-none ring-0 focus:outline-none focus:ring-0"
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
        {displayedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            ownProduct={ownProduct}
            isScraping={scrapingId === product.id}
            isDeleting={deletingId === product.id}
            onScrape={handleScrape}
            onDelete={handleDelete}
          />
        ))}
        {pending.map((item) => (
          <ScrapingCompetitorCard
            key={item.id}
            domain={item.domain}
            url={item.url}
            isDeleting={deletingId === item.id}
            onDelete={() => handleDelete(item.id)}
          />
        ))}
        <button
          type="button"
          onClick={() => setTrackOpen(true)}
          aria-label={`Add a competitor link for ${ownProduct.name}`}
          className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-4 text-center transition-colors hover:border-[#0080FF]/70 hover:bg-zinc-900"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-zinc-400">
            <Plus className="h-5 w-5" weight="bold" />
          </span>
          <span className="mt-3 text-sm font-medium text-zinc-200">Add competitor link</span>
          <span className="mt-1 text-xs text-zinc-500">Paste any product URL</span>
        </button>
      </div>

      <TrackCompetitorModal
        open={trackOpen}
        ownProductName={ownProduct.name}
        onClose={() => setTrackOpen(false)}
        onSubmit={handleAddCompetitor}
      />
    </div>
  );
};

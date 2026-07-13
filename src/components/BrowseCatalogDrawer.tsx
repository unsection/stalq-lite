"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { CaretDown, MagnifyingGlass, X } from "@phosphor-icons/react";
import { cn, formatPrice, getFaviconUrl } from "@/lib/utils";

type CatalogProduct = {
  id: string;
  name: string;
  domain: string;
  brand: string;
  sku: string;
  price: number;
  change: number;
  status: "active" | "paused" | "error";
};

type BrowseCatalogDrawerProps = {
  open: boolean;
  onClose: () => void;
  selectedId?: string | null;
  onSelect?: (productId: string) => void;
};

const MOCK_CATALOG: CatalogProduct[] = [
  {
    id: "mock-logitech",
    name: "Logitech MX Master 3S",
    domain: "walmart.com",
    brand: "Walmart",
    sku: "LOGI-MX3S-WHT",
    price: 78.99,
    change: 0.1,
    status: "active",
  },
];

const FILTERS = [
  { id: "all", label: "All..." },
  { id: "brands", label: "All brands" },
  { id: "status", label: "Any status" },
  { id: "sort", label: "Recently..." },
] as const;

export const BrowseCatalogDrawer = ({
  open,
  onClose,
  selectedId = "mock-logitech",
  onSelect,
}: BrowseCatalogDrawerProps) => {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  // Reset search and slide-out state when open toggles (adjustment during render).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
    } else {
      setVisible(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => setVisible(true));
    const timer = window.setTimeout(() => inputRef.current?.focus(), 180);
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const normalized = query.trim().toLowerCase();
  const filtered = MOCK_CATALOG.filter((product) => {
    if (!normalized) return true;
    return (
      product.name.toLowerCase().includes(normalized) ||
      product.brand.toLowerCase().includes(normalized) ||
      product.sku.toLowerCase().includes(normalized) ||
      product.domain.toLowerCase().includes(normalized)
    );
  });

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleBackdropKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClose();
    }
  };

  const handleSelect = (productId: string) => {
    onSelect?.(productId);
    onClose();
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-end bg-black/70 transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0",
      )}
      role="presentation"
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "flex h-full w-full max-w-lg flex-col border-l border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 transition-transform duration-200 ease-out",
          visible ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-start justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-xl font-semibold text-white">
              Browse catalog
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {filtered.length} of {MOCK_CATALOG.length} products
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close browse catalog"
            className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            <X className="h-5 w-5" weight="bold" />
          </button>
        </header>

        <div className="space-y-3 border-b border-zinc-800 px-5 py-4">
          <label className="flex items-center gap-3 rounded-full border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 focus-within:border-[#0080FF]">
            <MagnifyingGlass className="h-5 w-5 shrink-0 text-zinc-500" weight="duotone" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, SKU, brand, tag..."
              aria-label="Search catalog"
              className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-500"
            />
          </label>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                aria-label={`Filter: ${filter.label}`}
                className="inline-flex items-center justify-between gap-1 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
              >
                <span className="truncate">{filter.label}</span>
                <CaretDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" weight="duotone" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <ul className="space-y-2">
            {filtered.map((product) => {
              const isSelected = selectedId === product.id;
              const isUp = product.change >= 0;

              return (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(product.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                      isSelected
                        ? "bg-[#0080FF]/10 ring-1 ring-[#0080FF]/30"
                        : "hover:bg-zinc-900",
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        product.status === "active" && "bg-emerald-400",
                        product.status === "paused" && "bg-amber-400",
                        product.status === "error" && "bg-red-400",
                      )}
                      aria-hidden
                    />

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getFaviconUrl(product.domain)}
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5"
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-medium text-white">
                        {product.name}
                      </span>
                      <span className="block truncate text-xs text-zinc-500">
                        {product.brand} · {product.sku}
                      </span>
                    </span>

                    <span className="shrink-0 text-right">
                      <span className="num block text-base font-medium text-white">
                        {formatPrice(product.price)}
                      </span>
                      <span
                        className={cn(
                          "num block text-xs",
                          isUp ? "text-emerald-400" : "text-red-400",
                        )}
                      >
                        {isUp ? "+" : ""}
                        {formatPrice(product.change)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {filtered.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-zinc-500">No products match your search.</p>
          ) : null}
        </div>
      </aside>
    </div>
  );
};

"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { MagnifyingGlass, Plus, X } from "@phosphor-icons/react";
import { cn, getFaviconUrl } from "@/lib/utils";

export type PickerProduct = {
  id: string;
  name: string;
  domain: string;
  sku?: string;
};

type ProductPickerModalProps = {
  open: boolean;
  onClose: () => void;
  products?: PickerProduct[];
  recent?: PickerProduct[];
  selectedId?: string | null;
  onSelect?: (product: PickerProduct) => void;
};

const MOCK_RECENT: PickerProduct[] = [
  {
    id: "mock-logitech",
    name: "Logitech MX Master 3S",
    domain: "walmart.com",
    sku: "LOGI-MX3S-WHT",
  },
];

const brandFromDomain = (domain: string) => {
  const host = domain.replace(/^www\./, "");
  const name = host.split(".")[0] ?? host;
  return name.charAt(0).toUpperCase() + name.slice(1);
};

export const ProductPickerModal = ({
  open,
  onClose,
  products = [],
  recent = MOCK_RECENT,
  selectedId = null,
  onSelect,
}: ProductPickerModalProps) => {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [wasOpen, setWasOpen] = useState(open);

  // Reset search whenever the dialog opens (state adjustment during render).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setQuery("");
  }

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const normalized = query.trim().toLowerCase();
  const filterProduct = (product: PickerProduct) => {
    if (!normalized) return true;
    return (
      product.name.toLowerCase().includes(normalized) ||
      product.domain.toLowerCase().includes(normalized) ||
      (product.sku?.toLowerCase().includes(normalized) ?? false)
    );
  };

  const filteredRecent = recent.filter(filterProduct);
  const filteredAll = products.filter(filterProduct);

  const handleSelect = (product: PickerProduct) => {
    onSelect?.(product);
    onClose();
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleBackdropKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[12vh]"
      role="presentation"
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50"
      >
        <h2 id={titleId} className="sr-only">
          Search products
        </h2>

        <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
          <MagnifyingGlass className="h-5 w-5 shrink-0 text-zinc-500" weight="duotone" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, SKU, brand, tag..."
            aria-label="Search products"
            className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product picker"
            className="rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            <X className="h-4 w-4" weight="bold" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {filteredRecent.length > 0 ? (
            <section className="border-b border-zinc-800 px-3 py-3">
              <p className="px-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Recent
              </p>
              <ul className="mt-2 space-y-1">
                {filteredRecent.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(product)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors",
                        selectedId === product.id
                          ? "bg-zinc-800"
                          : "bg-zinc-900/80 hover:bg-zinc-800",
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getFaviconUrl(product.domain)}
                          alt=""
                          width={18}
                          height={18}
                          className="h-[18px] w-[18px]"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-base font-medium text-white">
                          {product.name}
                        </span>
                        <span className="block truncate text-xs text-zinc-500">
                          {brandFromDomain(product.domain)}
                          {product.sku ? ` · ${product.sku}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="border-b border-zinc-800 px-3 py-3">
            <p className="px-2 text-xs font-medium text-zinc-500">
              All products ({filteredAll.length})
            </p>
            {filteredAll.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {filteredAll.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(product)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors",
                        selectedId === product.id
                          ? "bg-zinc-800"
                          : "hover:bg-zinc-900",
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getFaviconUrl(product.domain)}
                          alt=""
                          width={18}
                          height={18}
                          className="h-[18px] w-[18px]"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-base font-medium text-white">
                          {product.name}
                        </span>
                        <span className="block truncate text-xs text-zinc-500">
                          {brandFromDomain(product.domain)}
                          {product.sku ? ` · ${product.sku}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>

        <div className="px-3 py-2">
          <Link
            href="/products/new"
            onClick={onClose}
            className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-base text-white transition-colors hover:bg-zinc-900"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-300">
              <Plus className="h-4 w-4" weight="bold" />
            </span>
            Add product
          </Link>
        </div>
      </div>
    </div>
  );
};

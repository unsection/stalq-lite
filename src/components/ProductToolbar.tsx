"use client";

import { useEffect, useState } from "react";
import {
  ArrowSquareOut,
  CaretDown,
  ShareNetwork,
  SquaresFour,
} from "@phosphor-icons/react";
import { BrowseCatalogDrawer } from "@/components/BrowseCatalogDrawer";
import {
  ProductPickerModal,
  type PickerProduct,
} from "@/components/ProductPickerModal";
import { getFaviconUrl } from "@/lib/utils";

type ProductToolbarProps = {
  productCount?: number;
  products?: PickerProduct[];
};

const MOCK_PRODUCT: PickerProduct & { url: string } = {
  id: "mock-logitech",
  name: "Logitech MX Master 3S",
  domain: "walmart.com",
  sku: "LOGI-MX3S-WHT",
  url: "https://www.walmart.com",
};

export const ProductToolbar = ({
  productCount = 1,
  products = [],
}: ProductToolbarProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [selected, setSelected] = useState<PickerProduct>(MOCK_PRODUCT);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMetaK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isMetaK) return;
      event.preventDefault();
      setPickerOpen(true);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleOpenPicker = () => setPickerOpen(true);
  const handleClosePicker = () => setPickerOpen(false);
  const handleOpenCatalog = () => setCatalogOpen(true);
  const handleCloseCatalog = () => setCatalogOpen(false);

  const handleSelect = (product: PickerProduct) => {
    setSelected(product);
  };

  const handleCatalogSelect = (productId: string) => {
    if (productId === MOCK_PRODUCT.id) {
      setSelected(MOCK_PRODUCT);
    }
  };

  const handleVisit = () => {
    const url =
      selected.id === MOCK_PRODUCT.id
        ? MOCK_PRODUCT.url
        : `https://${selected.domain}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShare = async () => {
    const url =
      selected.id === MOCK_PRODUCT.id
        ? MOCK_PRODUCT.url
        : `https://${selected.domain}`;

    if (navigator.share) {
      await navigator.share({ title: selected.name, url });
      return;
    }

    await navigator.clipboard.writeText(url);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenPicker}
            aria-label={`Selected product: ${selected.name}`}
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-white transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getFaviconUrl(selected.domain)}
              alt=""
              width={16}
              height={16}
              className="h-4 w-4 shrink-0 rounded-sm"
            />
            <span className="truncate font-medium">{selected.name}</span>
            <CaretDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" weight="duotone" />
          </button>

          <button
            type="button"
            onClick={handleOpenCatalog}
            aria-label={`Browse all ${productCount} products`}
            aria-haspopup="dialog"
            aria-expanded={catalogOpen}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            <SquaresFour className="h-4 w-4 shrink-0 text-zinc-400" weight="duotone" />
            <span>Browse all ({productCount})</span>
          </button>

          <span className="hidden text-sm text-zinc-600 sm:inline" aria-hidden>
            ⌘ K
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleVisit}
            aria-label={`Visit ${selected.name}`}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            <ArrowSquareOut className="h-4 w-4 shrink-0 text-zinc-400" weight="duotone" />
            <span>Visit</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            aria-label={`Share ${selected.name}`}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            <ShareNetwork className="h-4 w-4 shrink-0 text-zinc-400" weight="duotone" />
            <span>Share</span>
          </button>
        </div>
      </div>

      <ProductPickerModal
        open={pickerOpen}
        onClose={handleClosePicker}
        products={products}
        selectedId={selected.id}
        onSelect={handleSelect}
      />

      <BrowseCatalogDrawer
        open={catalogOpen}
        onClose={handleCloseCatalog}
        selectedId={selected.id}
        onSelect={handleCatalogSelect}
      />
    </>
  );
};

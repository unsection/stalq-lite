"use client";

import { useEffect, useState } from "react";
import {
  ArrowSquareOut,
  CaretDown,
  Package,
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
  products: PickerProduct[];
  selected: PickerProduct | null;
  onSelect: (product: PickerProduct) => void;
  onAddProduct: () => void;
};

export const ProductToolbar = ({
  products,
  selected,
  onSelect,
  onAddProduct,
}: ProductToolbarProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);

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

  const handleVisit = () => {
    if (!selected?.url) return;
    window.open(selected.url, "_blank", "noopener,noreferrer");
  };

  const handleShare = async () => {
    if (!selected) return;
    const url = selected.url ?? undefined;

    if (navigator.share) {
      await navigator.share({ title: selected.name, url });
      return;
    }

    if (url) await navigator.clipboard.writeText(url);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenPicker}
            aria-label={selected ? `Selected product: ${selected.name}` : "Select a product"}
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-white transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            {selected?.domain ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={getFaviconUrl(selected.domain)}
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 shrink-0 rounded-sm"
              />
            ) : (
              <Package className="h-4 w-4 shrink-0 text-zinc-400" weight="duotone" />
            )}
            <span className="truncate font-medium">{selected?.name ?? "Select a product"}</span>
            <CaretDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" weight="duotone" />
          </button>

          <button
            type="button"
            onClick={handleOpenCatalog}
            aria-label={`Browse all ${products.length} products`}
            aria-haspopup="dialog"
            aria-expanded={catalogOpen}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            <SquaresFour className="h-4 w-4 shrink-0 text-zinc-400" weight="duotone" />
            <span>Browse all ({products.length})</span>
          </button>

          <span className="hidden text-sm text-zinc-600 sm:inline" aria-hidden>
            ⌘ K
          </span>
        </div>

        {selected ? (
          <div className="flex items-center gap-2">
            {selected.url ? (
              <button
                type="button"
                onClick={handleVisit}
                aria-label={`Visit ${selected.name}`}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-2 text-base text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
              >
                <ArrowSquareOut className="h-4 w-4 shrink-0 text-zinc-400" weight="duotone" />
                <span>Visit</span>
              </button>
            ) : null}

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
        ) : null}
      </div>

      <ProductPickerModal
        open={pickerOpen}
        onClose={handleClosePicker}
        products={products}
        selectedId={selected?.id ?? null}
        onSelect={onSelect}
        onAddProduct={onAddProduct}
      />

      <BrowseCatalogDrawer open={catalogOpen} onClose={handleCloseCatalog} />
    </>
  );
};

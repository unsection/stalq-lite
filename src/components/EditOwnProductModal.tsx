"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { X } from "@phosphor-icons/react";
import type { OwnProduct } from "@/db/schema";
import { Button } from "@/components/ui/Button";

type EditOwnProductModalProps = {
  product: OwnProduct | null;
  open: boolean;
  onClose: () => void;
  onSaved: (product: OwnProduct) => void;
};

type FormState = {
  name: string;
  sku: string;
  price: string;
  url: string;
};

const toForm = (product: OwnProduct | null): FormState => ({
  name: product?.name ?? "",
  sku: product?.sku ?? "",
  price: product?.price ?? "",
  url: product?.url ?? "",
});

export const EditOwnProductModal = ({
  product,
  open,
  onClose,
  onSaved,
}: EditOwnProductModalProps) => {
  const titleId = useId();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<FormState>(() => toForm(product));
  const [wasOpen, setWasOpen] = useState(open);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setValues(toForm(product));
      setError(null);
    }
  }

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => nameInputRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, open]);

  if (!open || !product) return null;

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = values.name.trim();
    const priceNumber = Number(values.price);

    if (!name) {
      setError("Product name is required");
      return;
    }

    if (!values.price || Number.isNaN(priceNumber) || priceNumber <= 0) {
      setError("Enter a valid price greater than 0");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/own-products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku: values.sku.trim() || null,
          url: values.url.trim() || null,
          price: priceNumber,
        }),
      });
      const updated = await response.json();

      if (!response.ok) {
        throw new Error(updated.message ?? "Failed to update product");
      }

      onSaved(updated as OwnProduct);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to update product");
    } finally {
      setIsSaving(false);
    }
  };

  const updateValue = (field: keyof FormState, value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[12vh]"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 id={titleId} className="text-lg font-medium text-white">
            Edit product
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit product dialog"
            className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            <X className="h-5 w-5" weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <label className="block space-y-2">
            <span className="text-sm text-zinc-400">Product name</span>
            <input
              ref={nameInputRef}
              required
              value={values.name}
              onChange={(event) => updateValue("name", event.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
              placeholder="Logitech MX Master 3S"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-400">SKU (optional)</span>
            <input
              value={values.sku}
              onChange={(event) => updateValue("sku", event.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
              placeholder="LOGI-MX3S-WHT"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-400">Price</span>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={values.price}
              onChange={(event) => updateValue("price", event.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
              placeholder="78.99"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-400">Product link (optional)</span>
            <input
              type="url"
              value={values.url}
              onChange={(event) => updateValue("url", event.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
              placeholder="https://yourstore.com/product"
            />
          </label>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { X } from "@phosphor-icons/react";
import type { OwnProduct } from "@/db/schema";
import { Button } from "@/components/ui/Button";

type MarginCostsModalProps = {
  product: OwnProduct | null;
  open: boolean;
  onClose: () => void;
  onSaved: (product: OwnProduct) => void;
};

type MarginForm = {
  costPerUnit: string;
  marketplaceFeePercent: string;
  shippingCostPerUnit: string;
  targetMarginPercent: string;
};

const toForm = (product: OwnProduct | null): MarginForm => ({
  costPerUnit: product?.costPerUnit ?? "0",
  marketplaceFeePercent: product?.marketplaceFeePercent ?? "0",
  shippingCostPerUnit: product?.shippingCostPerUnit ?? "0",
  targetMarginPercent: product?.targetMarginPercent ?? "20",
});

export const MarginCostsModal = ({ product, open, onClose, onSaved }: MarginCostsModalProps) => {
  const titleId = useId();
  const costInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<MarginForm>(() => toForm(product));
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

    const timer = window.setTimeout(() => costInputRef.current?.focus(), 0);
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
    const data = {
      costPerUnit: Number(values.costPerUnit),
      marketplaceFeePercent: Number(values.marketplaceFeePercent),
      shippingCostPerUnit: Number(values.shippingCostPerUnit),
      targetMarginPercent: Number(values.targetMarginPercent),
    };

    if (Object.values(data).some((value) => Number.isNaN(value) || value < 0)) {
      setError("Enter zero or a positive number for every field.");
      return;
    }
    if (data.marketplaceFeePercent > 100 || data.targetMarginPercent > 100) {
      setError("Percentages cannot be more than 100%.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/own-products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const updated = await response.json();
      if (!response.ok) throw new Error(updated.message ?? "Unable to save margin settings");

      onSaved(updated as OwnProduct);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save margin settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateValue = (field: keyof MarginForm, value: string) =>
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
            Margin &amp; costs
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close margin and costs dialog"
            className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            <X className="h-5 w-5" weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Cost per unit (COGS)"
              prefix="$"
              inputRef={costInputRef}
              value={values.costPerUnit}
              onChange={(value) => updateValue("costPerUnit", value)}
            />
            <NumberField
              label="Marketplace / payment fee"
              suffix="%"
              value={values.marketplaceFeePercent}
              onChange={(value) => updateValue("marketplaceFeePercent", value)}
            />
            <NumberField
              label="Shipping cost per unit"
              prefix="$"
              value={values.shippingCostPerUnit}
              onChange={(value) => updateValue("shippingCostPerUnit", value)}
            />
            <NumberField
              label="Target healthy margin"
              suffix="%"
              value={values.targetMarginPercent}
              onChange={(value) => updateValue("targetMarginPercent", value)}
            />
          </div>

          <p className="text-xs leading-5 text-zinc-500">
            Margin is calculated as (price - cost - fees - shipping) divided by price. Anything below 5% is shown as danger.
          </p>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

type NumberFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
};

const NumberField = ({ label, value, onChange, prefix, suffix, inputRef }: NumberFieldProps) => (
  <label className="block space-y-2">
    <span className="text-sm text-zinc-400">{label}</span>
    <span className="flex items-center rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 focus-within:border-zinc-600">
      {prefix ? <span className="mr-2 text-sm text-zinc-500">{prefix}</span> : null}
      <input
        ref={inputRef}
        type="number"
        min="0"
        max={suffix ? "100" : undefined}
        step="0.01"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="num min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
      />
      {suffix ? <span className="ml-2 text-sm text-zinc-500">{suffix}</span> : null}
    </span>
  </label>
);

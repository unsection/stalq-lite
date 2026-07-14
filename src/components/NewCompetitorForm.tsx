"use client";

import { useRouter } from "next/navigation";
import type { OwnProduct } from "@/db/schema";
import { ScrapeSettingsForm } from "@/components/ScrapeSettingsForm";
import type { ProductInput } from "@/lib/validation";

type NewCompetitorFormProps = {
  ownProducts: OwnProduct[];
  defaultOwnProductId?: string;
};

export const NewCompetitorForm = ({ ownProducts, defaultOwnProductId }: NewCompetitorFormProps) => {
  const router = useRouter();

  const handleSubmit = async (values: ProductInput) => {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message ?? "Failed to create competitor");
    }

    const product = await response.json();
    router.push(`/products/${product.id}`);
    router.refresh();
  };

  if (ownProducts.length === 0) {
    return <p className="text-sm text-zinc-500">Add your own product before adding a competitor.</p>;
  }

  return (
      <ScrapeSettingsForm
        ownProducts={ownProducts}
        initialValues={defaultOwnProductId ? { ownProductId: defaultOwnProductId } : undefined}
      submitLabel="Add competitor"
      onSubmit={handleSubmit}
    />
  );
};

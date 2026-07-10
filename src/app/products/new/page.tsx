"use client";

import { useRouter } from "next/navigation";
import { ScrapeSettingsForm } from "@/components/ScrapeSettingsForm";
import type { ProductInput } from "@/lib/validation";

const NewProductPage = () => {
  const router = useRouter();

  const handleSubmit = async (values: ProductInput) => {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message ?? "Failed to create product");
    }

    const product = await response.json();
    router.push(`/products/${product.id}`);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Add product</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configure the URL and Context.dev scrape settings for this monitor.
        </p>
      </div>
      <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
        <ScrapeSettingsForm submitLabel="Create product" onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default NewProductPage;

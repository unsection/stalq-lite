"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowsClockwise, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OwnProduct, PriceHistoryRow, Product, ScrapeLog } from "@/db/schema";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { ScrapeSettingsForm } from "@/components/ScrapeSettingsForm";
import { Button } from "@/components/ui/Button";
import type { ProductInput } from "@/lib/validation";
import { formatPrice } from "@/lib/utils";

type ProductDetailClientProps = {
  product: Product;
  history: PriceHistoryRow[];
  logs: ScrapeLog[];
  ownProducts: OwnProduct[];
};

const ProductDetailClient = ({ product, history, logs, ownProducts }: ProductDetailClientProps) => {
  const router = useRouter();
  const [isScraping, setIsScraping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdate = async (values: ProductInput) => {
    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message ?? "Failed to update product");
    }

    router.refresh();
  };

  const handleScrape = async () => {
    setIsScraping(true);
    try {
      const response = await fetch(`/api/products/${product.id}/scrape`, { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message ?? "Scrape failed");
      }
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Scrape failed");
    } finally {
      setIsScraping(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this product and all scrape history?")) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete product");
      }
      router.push("/");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Delete failed");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
            ← Products
          </Link>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{product.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">{product.url}</p>
          <p className="mt-3 text-2xl font-medium text-white num">
            {formatPrice(
              product.currentPrice ? Number(product.currentPrice) : null,
              product.currency ?? "USD",
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleScrape} disabled={isScraping}>
            <ArrowsClockwise className={`mr-1.5 h-4 w-4 ${isScraping ? "animate-spin" : ""}`} />
            {isScraping ? "Scraping..." : "Scrape now"}
          </Button>
          <Button variant="ghost" onClick={handleDelete} disabled={isDeleting} aria-label="Delete product">
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <section className="space-y-4 rounded-lg border border-zinc-900 bg-zinc-950 p-6">
        <div>
          <h2 className="text-lg font-medium text-white">Price history</h2>
          <p className="text-sm text-zinc-500">Recorded prices from successful scrapes.</p>
        </div>
        <PriceHistoryChart data={history} />
      </section>

      <section className="rounded-lg border border-zinc-900 bg-zinc-950 p-6">
        <ScrapeSettingsForm
          ownProducts={ownProducts}
          initialValues={{
            ownProductId: product.ownProductId ?? "",
            name: product.name,
            url: product.url,
            useMainContentOnly: product.useMainContentOnly,
            settleAnimations: product.settleAnimations,
            includeSelectors: product.includeSelectors ?? [],
            excludeSelectors: product.excludeSelectors ?? [],
            country: product.country ?? "",
            waitForMs: product.waitForMs,
            timeoutEnabled: product.timeoutEnabled,
            timeoutMs: product.timeoutMs ?? 30000,
          }}
          submitLabel="Save settings"
          onSubmit={handleUpdate}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-white">Recent logs</h2>
          <p className="text-sm text-zinc-500">Latest scrape attempts for this product.</p>
        </div>
        <div className="overflow-hidden rounded-lg border border-zinc-900">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-900 bg-zinc-950 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Price</th>
                <th className="px-4 py-3 font-medium text-right">Duration</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    No scrape logs yet.
                  </td>
                </tr>
              ) : (
                logs
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map((log) => (
                    <tr key={log.id} className="border-b border-zinc-900/80">
                      <td className="px-4 py-3 text-zinc-300">
                        {format(new Date(log.createdAt), "MMM d, hh:mm a")}
                      </td>
                      <td className="px-4 py-3 capitalize text-zinc-400">
                        {log.status.replace("_", " ")}
                      </td>
                      <td className="num px-4 py-3 text-right text-zinc-200">
                        {log.price
                          ? formatPrice(Number(log.price), log.currency ?? "USD")
                          : "—"}
                      </td>
                      <td className="num px-4 py-3 text-right text-zinc-500">
                        {log.durationMs ? `${(log.durationMs / 1000).toFixed(1)}s` : "—"}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ProductDetailClient;

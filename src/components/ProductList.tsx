"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowSquareOut, ArrowsClockwise } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/db/schema";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

type ProductListProps = {
  products: Product[];
};

export const ProductList = ({ products }: ProductListProps) => {
  const router = useRouter();
  const [scrapingId, setScrapingId] = useState<string | null>(null);

  const handleScrape = async (productId: string) => {
    setScrapingId(productId);
    try {
      const response = await fetch(`/api/products/${productId}/scrape`, { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message ?? "Scrape failed");
      }
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Scrape failed");
    } finally {
      setScrapingId(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-900 bg-zinc-950 px-6 py-16 text-center">
        <h2 className="text-lg font-medium text-white">No products yet</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Add a product URL and scrape settings to start monitoring prices.
        </p>
        <Link
          href="/products/new"
          className="mt-6 inline-flex rounded-full bg-[#0080FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0066cc]"
        >
          Add product
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-900">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-900 bg-zinc-950 text-left text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">Domain</th>
            <th className="px-4 py-3 font-medium text-right">Price</th>
            <th className="px-4 py-3 font-medium">Last scraped</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-zinc-900/80 hover:bg-zinc-950/60">
              <td className="px-4 py-3">
                <Link href={`/products/${product.id}`} className="font-medium text-white hover:underline">
                  {product.name}
                </Link>
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  <span className="truncate">{product.url}</span>
                  <ArrowSquareOut className="h-3 w-3 shrink-0" />
                </a>
              </td>
              <td className="px-4 py-3 text-zinc-400">{product.domain}</td>
              <td className="num px-4 py-3 text-right text-zinc-200">
                {formatPrice(
                  product.currentPrice ? Number(product.currentPrice) : null,
                  product.currency ?? "USD",
                )}
              </td>
              <td className="px-4 py-3 text-zinc-500">
                {product.lastScrapedAt
                  ? formatDistanceToNow(new Date(product.lastScrapedAt), { addSuffix: true })
                  : "Never"}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleScrape(product.id)}
                    disabled={scrapingId === product.id}
                    aria-label={`Scrape ${product.name}`}
                  >
                    <ArrowsClockwise
                      className={`mr-1.5 h-3.5 w-3.5 ${scrapingId === product.id ? "animate-spin" : ""}`}
                    />
                    {scrapingId === product.id ? "Scraping..." : "Scrape now"}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

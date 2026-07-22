import { db } from "@/db";
import { products } from "@/db/schema";
import { runProductScrape } from "@/lib/scrape/runProductScrape";

type ScrapeAllSummary = {
  total: number;
  success: number;
  no_price: number;
  error: number;
  timeout: number;
};

export type ScrapeProductResult = {
  productId: string;
  name: string;
  url: string;
  ownProductId: string | null;
  previousPrice: number | null;
  newPrice: number | null;
  currency: string | null;
};

export type ScrapeAllResult = {
  summary: ScrapeAllSummary;
  results: ScrapeProductResult[];
};

const parseNumeric = (value: string | null): number | null => {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const scrapeAllProducts = async (): Promise<ScrapeAllResult> => {
  const productRows = await db
    .select({
      id: products.id,
      name: products.name,
      url: products.url,
      currentPrice: products.currentPrice,
      currency: products.currency,
      ownProductId: products.ownProductId,
    })
    .from(products);

  const summary: ScrapeAllSummary = {
    total: productRows.length,
    success: 0,
    no_price: 0,
    error: 0,
    timeout: 0,
  };
  const results: ScrapeProductResult[] = [];

  for (const product of productRows) {
    const previousPrice = parseNumeric(product.currentPrice);
    const result = await runProductScrape(product.id);

    if (result.ok) {
      if (result.data.status === "success") {
        summary.success++;
        results.push({
          productId: product.id,
          name: product.name,
          url: product.url,
          ownProductId: product.ownProductId,
          previousPrice,
          newPrice: result.data.price,
          currency: result.data.currency ?? product.currency,
        });
      } else if (result.data.status === "no_price") {
        summary.no_price++;
      }
      continue;
    }

    if (result.data?.status === "timeout") {
      summary.timeout++;
    } else {
      summary.error++;
    }
  }

  return { summary, results };
};

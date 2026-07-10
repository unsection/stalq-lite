import { db } from "@/db";
import { products } from "@/db/schema";
import { runProductScrape } from "@/lib/scrape/runProductScrape";

export type ScrapeAllSummary = {
  total: number;
  success: number;
  no_price: number;
  error: number;
  timeout: number;
};

export const scrapeAllProducts = async (): Promise<ScrapeAllSummary> => {
  const productRows = await db.select({ id: products.id }).from(products);

  const summary: ScrapeAllSummary = {
    total: productRows.length,
    success: 0,
    no_price: 0,
    error: 0,
    timeout: 0,
  };

  for (const product of productRows) {
    const result = await runProductScrape(product.id);

    if (result.ok) {
      if (result.data.status === "success") {
        summary.success++;
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

  return summary;
};

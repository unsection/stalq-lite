import { eq } from "drizzle-orm";
import { db } from "@/db";
import { priceHistory, products, scrapeLogs } from "@/db/schema";
import {
  getScrapeErrorMessage,
  isTimeoutError,
  scrapeHtml,
} from "@/lib/context/scrapeHtml";
import { extractPriceFromHtml } from "@/lib/pricing/extractPriceFromHtml";

export const runProductScrape = async (productId: string) => {
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);

  if (!product) {
    return { ok: false as const, status: 404, message: "Product not found" };
  }

  const startedAt = Date.now();

  try {
    const result = await scrapeHtml({
      url: product.url,
      useMainContentOnly: product.useMainContentOnly,
      settleAnimations: product.settleAnimations,
      includeSelectors: product.includeSelectors ?? [],
      excludeSelectors: product.excludeSelectors ?? [],
      country: product.country,
      waitForMs: product.waitForMs,
      timeoutEnabled: product.timeoutEnabled,
      timeoutMs: product.timeoutMs,
    });

    const durationMs = Date.now() - startedAt;
    const extracted = extractPriceFromHtml(result.html);

    if (!extracted) {
      await db.insert(scrapeLogs).values({
        productId: product.id,
        status: "no_price",
        durationMs,
        creditsConsumed: result.creditsConsumed,
        finishReason: "no_price",
        country: product.country,
        waitForMs: product.waitForMs,
      });

      await db
        .update(products)
        .set({ lastScrapedAt: new Date(), updatedAt: new Date() })
        .where(eq(products.id, product.id));

      return {
        ok: true as const,
        status: 200,
        data: {
          status: "no_price" as const,
          price: null,
          currency: product.currency,
          durationMs,
        },
      };
    }

    await db.insert(scrapeLogs).values({
      productId: product.id,
      status: "success",
      price: extracted.price.toFixed(2),
      currency: extracted.currency,
      durationMs,
      creditsConsumed: result.creditsConsumed,
      finishReason: "stop",
      country: product.country,
      waitForMs: product.waitForMs,
    });

    await db.insert(priceHistory).values({
      productId: product.id,
      price: extracted.price.toFixed(2),
      currency: extracted.currency,
    });

    await db
      .update(products)
      .set({
        currentPrice: extracted.price.toFixed(2),
        currency: extracted.currency,
        lastScrapedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(products.id, product.id));

    return {
      ok: true as const,
      status: 200,
      data: {
        status: "success" as const,
        price: extracted.price,
        currency: extracted.currency,
        durationMs,
      },
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const status = isTimeoutError(error) ? "timeout" : "error";

    await db.insert(scrapeLogs).values({
      productId: product.id,
      status,
      durationMs,
      errorMessage: getScrapeErrorMessage(error),
      finishReason: status,
      country: product.country,
      waitForMs: product.waitForMs,
    });

    await db
      .update(products)
      .set({ lastScrapedAt: new Date(), updatedAt: new Date() })
      .where(eq(products.id, product.id));

    return {
      ok: false as const,
      status: status === "timeout" ? 408 : 500,
      message: getScrapeErrorMessage(error),
      data: { status, durationMs },
    };
  }
};

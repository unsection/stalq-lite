import { eq } from "drizzle-orm";
import { db } from "@/db";
import { priceHistory, products, scrapeLogs, websiteScrapeSettings } from "@/db/schema";
import { extractPriceWithOpenRouter } from "@/lib/ai/extractPriceWithOpenRouter";
import { getAiSettings } from "@/lib/ai/getAiSettings";
import {
  captureScreenshot,
  extractPrice,
  getScrapeErrorMessage,
  isTimeoutError,
  scrapeHtml,
  type WebsiteMethodSettings,
} from "@/lib/context/scrapeHtml";
import { UNREGISTERED_SITE_SCRAPE_DEFAULTS } from "@/lib/scrape/defaultScrapeSettings";

export const runProductScrape = async (productId: string) => {
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);

  if (!product) {
    return { ok: false as const, status: 404, message: "Product not found" };
  }

  const [websiteRule] = await db
    .select()
    .from(websiteScrapeSettings)
    .where(eq(websiteScrapeSettings.domain, product.domain))
    .limit(1);
  const websiteSettings = (websiteRule?.settings ?? {}) as WebsiteMethodSettings;
  const defaults = UNREGISTERED_SITE_SCRAPE_DEFAULTS;

  const startedAt = Date.now();

  try {
    if (websiteRule?.method === "screenshot") {
      const screenshot = await captureScreenshot(product.url, websiteSettings);
      const durationMs = Date.now() - startedAt;
      await db.insert(scrapeLogs).values({
        productId: product.id,
        status: "no_price",
        durationMs,
        creditsConsumed: screenshot.creditsConsumed,
        finishReason: "screenshot_captured",
        errorMessage: screenshot.screenshot
          ? `Screenshot captured: ${screenshot.screenshot}`
          : "Screenshot captured",
        country: websiteSettings.country ?? product.country,
        waitForMs: websiteSettings.waitForMs ?? product.waitForMs,
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

    if (websiteRule?.method === "extract") {
      const result = await extractPrice(product.url, websiteSettings);
      const durationMs = Date.now() - startedAt;
      const extracted =
        result.price == null ? null : { price: result.price, currency: result.currency };

      if (!extracted) {
        await db.insert(scrapeLogs).values({
          productId: product.id,
          status: "no_price",
          durationMs,
          creditsConsumed: result.creditsConsumed,
          finishReason: "no_price",
          country: websiteSettings.country ?? product.country,
          waitForMs: websiteSettings.waitForMs ?? product.waitForMs,
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
        country: websiteSettings.country ?? product.country,
        waitForMs: websiteSettings.waitForMs ?? product.waitForMs,
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
    }

    // HTML scrape → OpenRouter reads scrape JSON and decides the competitor price.
    const htmlSettings = websiteRule
      ? {
          useMainContentOnly: Boolean(websiteSettings.useMainContentOnly),
          settleAnimations: Boolean(websiteSettings.settleAnimations),
          includeSelectors: websiteSettings.includeSelectors ?? [],
          excludeSelectors: websiteSettings.excludeSelectors ?? [],
          country: websiteSettings.country ?? null,
          waitForMs: websiteSettings.waitForMs ?? null,
          timeoutEnabled: Boolean(websiteSettings.timeoutMs),
          timeoutMs: websiteSettings.timeoutMs ?? null,
          ...websiteSettings,
        }
      : {
          useMainContentOnly: defaults.useMainContentOnly,
          settleAnimations: defaults.settleAnimations,
          includeSelectors: [...defaults.includeSelectors],
          excludeSelectors: [...defaults.excludeSelectors],
          country: defaults.country,
          waitForMs: defaults.waitForMs,
          timeoutEnabled: defaults.timeoutEnabled,
          timeoutMs: defaults.timeoutMs,
          pdfShouldParse: defaults.pdfShouldParse,
          maxAgeMs: defaults.maxAgeMs,
        };

    const result = await scrapeHtml({
      url: product.url,
      ...htmlSettings,
    });
    const country = websiteRule ? websiteSettings.country ?? product.country : defaults.country;
    const waitForMs = websiteRule
      ? websiteSettings.waitForMs ?? product.waitForMs
      : defaults.waitForMs;

    const aiSettings = await getAiSettings();
    let extracted: { price: number; currency: string } | null = null;
    let aiError: string | null = null;

    try {
      extracted = await extractPriceWithOpenRouter({
        html: result.html,
        url: product.url,
        scrapeResponse: result.response,
        apiKey: aiSettings.openrouterApiKey,
        model: aiSettings.model,
      });
    } catch (error) {
      aiError = getScrapeErrorMessage(error);
    }

    const durationMs = Date.now() - startedAt;

    if (!extracted) {
      await db.insert(scrapeLogs).values({
        productId: product.id,
        status: "no_price",
        durationMs,
        creditsConsumed: result.creditsConsumed,
        finishReason: "ai_no_price",
        errorMessage: aiError,
        country,
        waitForMs,
        scrapeResponse: result.response,
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
          message: aiError,
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
      finishReason: "ai_price",
      country,
      waitForMs,
      scrapeResponse: result.response,
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
      country: websiteRule ? websiteSettings.country ?? product.country : defaults.country,
      waitForMs: websiteRule
        ? websiteSettings.waitForMs ?? product.waitForMs
        : defaults.waitForMs,
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

import ContextDev from "context.dev";
import type {
  WebExtractParams,
  WebScreenshotParams,
  WebWebScrapeHTMLParams,
  WebWebScrapeHTMLResponse,
} from "context.dev/resources/web";
import { extractPriceFromText, parseAmount } from "@/lib/pricing/extractPriceFromHtml";

export type ScrapeSettings = {
  url: string;
  useMainContentOnly: boolean;
  settleAnimations: boolean;
  includeSelectors: string[];
  excludeSelectors: string[];
  country: string | null;
  waitForMs: number | null;
  timeoutEnabled: boolean;
  timeoutMs: number | null;
};

export type WebsiteMethodSettings = {
  country?: string | null;
  waitForMs?: number | null;
  timeoutMs?: number | null;
  maxAgeMs?: number | null;
  headers?: Record<string, string>;
  useMainContentOnly?: boolean;
  settleAnimations?: boolean;
  includeSelectors?: string[];
  excludeSelectors?: string[];
  includeFrames?: boolean;
  pdfStart?: number | null;
  pdfEnd?: number | null;
  pdfShouldParse?: boolean;
  colorScheme?: "light" | "dark" | null;
  fullScreenshot?: boolean;
  handleCookiePopup?: boolean;
  scrollOffset?: number | null;
  viewportWidth?: number | null;
  viewportHeight?: number | null;
  factCheck?: boolean;
  followSubdomains?: boolean;
  instructions?: string | null;
  maxDepth?: number | null;
  maxPages?: number | null;
  stopAfterMs?: number | null;
};

export type ScrapeHtmlResult = {
  html: string;
  url: string;
  type: WebWebScrapeHTMLResponse["type"];
  metadata: WebWebScrapeHTMLResponse["metadata"];
  /** Full Context.dev JSON response for logging/inspection. */
  response: WebWebScrapeHTMLResponse;
  creditsConsumed?: number;
  creditsRemaining?: number;
};

const getClient = () => {
  const apiKey = process.env.CONTEXT_DEV_API_KEY;
  if (!apiKey) {
    throw new Error("CONTEXT_DEV_API_KEY environment variable is not set");
  }
  return new ContextDev({ apiKey });
};

export const scrapeHtml = async (settings: ScrapeSettings & WebsiteMethodSettings): Promise<ScrapeHtmlResult> => {
  const client = getClient();

  const params: WebWebScrapeHTMLParams = {
    url: settings.url,
    useMainContentOnly: settings.useMainContentOnly,
    settleAnimations: settings.settleAnimations,
    includeSelectors:
      settings.includeSelectors.length > 0 ? settings.includeSelectors : undefined,
    excludeSelectors:
      settings.excludeSelectors.length > 0 ? settings.excludeSelectors : undefined,
    waitForMs: settings.waitForMs ?? undefined,
    timeoutMS: settings.timeoutEnabled && settings.timeoutMs ? settings.timeoutMs : undefined,
    country: settings.country ? (settings.country as WebWebScrapeHTMLParams["country"]) : undefined,
    includeFrames: settings.includeFrames,
    headers: Object.keys(settings.headers ?? {}).length ? settings.headers : undefined,
    pdf: settings.pdfShouldParse ? {
      shouldParse: true,
      start: settings.pdfStart ?? undefined,
      end: settings.pdfEnd ?? undefined,
    } : undefined,
    maxAgeMs: settings.maxAgeMs ?? 0,
  };

  const response = await client.web.webScrapeHTML(params);

  // Plain object in Context.dev playground order (for jsonb + viewer).
  const payload: WebWebScrapeHTMLResponse = {
    success: response.success,
    html: response.html,
    url: response.url,
    type: response.type,
    metadata: response.metadata,
    ...(response.key_metadata ? { key_metadata: response.key_metadata } : {}),
  };

  return {
    html: payload.html,
    url: payload.url,
    type: payload.type,
    metadata: payload.metadata,
    response: payload,
    creditsConsumed: response.key_metadata?.credits_consumed,
    creditsRemaining: response.key_metadata?.credits_remaining,
  };
};

export const extractPrice = async (url: string, settings: WebsiteMethodSettings) => {
  const client = getClient();
  const params: WebExtractParams = {
    url,
    schema: {
      type: "object",
      properties: {
        price: { type: ["number", "string", "null"], description: "Current purchasable product price" },
        currency: { type: ["string", "null"], description: "Three-letter currency code" },
      },
      required: ["price", "currency"],
    },
    factCheck: settings.factCheck ?? true,
    followSubdomains: settings.followSubdomains,
    includeFrames: settings.includeFrames,
    instructions: settings.instructions || "Return the current purchasable price. Do not return a crossed-out list price, a monthly payment, shipping, tax, or an unrelated product price.",
    maxAgeMs: settings.maxAgeMs ?? 0,
    maxDepth: settings.maxDepth ?? 0,
    maxPages: settings.maxPages ?? 1,
    stopAfterMs: settings.stopAfterMs ?? undefined,
    timeoutMS: settings.timeoutMs ?? undefined,
    waitForMs: settings.waitForMs ?? undefined,
    pdf: settings.pdfShouldParse ? { shouldParse: true, start: settings.pdfStart ?? undefined, end: settings.pdfEnd ?? undefined } : undefined,
  };
  const response = await client.web.extract(params);
  const price = parseAmount(response.data.price) ?? extractPriceFromText(String(response.data.price ?? ""))?.price ?? null;
  const currency = typeof response.data.currency === "string" && response.data.currency.trim()
    ? response.data.currency.trim().toUpperCase()
    : extractPriceFromText(String(response.data.price ?? ""))?.currency ?? "USD";
  return { price, currency, creditsConsumed: response.key_metadata?.credits_consumed, creditsRemaining: response.key_metadata?.credits_remaining };
};

export const captureScreenshot = async (url: string, settings: WebsiteMethodSettings) => {
  const client = getClient();
  const params: WebScreenshotParams = {
    directUrl: url,
    colorScheme: settings.colorScheme ?? undefined,
    country: settings.country ? settings.country as WebScreenshotParams["country"] : undefined,
    fullScreenshot: settings.fullScreenshot ? "true" : undefined,
    handleCookiePopup: settings.handleCookiePopup ? "true" : undefined,
    scrollOffset: settings.scrollOffset ?? undefined,
    viewport: settings.viewportWidth || settings.viewportHeight ? { width: settings.viewportWidth ?? undefined, height: settings.viewportHeight ?? undefined } : undefined,
    maxAgeMs: settings.maxAgeMs ?? 0,
    timeoutMS: settings.timeoutMs ?? undefined,
    waitForMs: settings.waitForMs ?? undefined,
  };
  const response = await client.web.screenshot(params);
  return { screenshot: response.screenshot, creditsConsumed: response.key_metadata?.credits_consumed };
};

export const isTimeoutError = (error: unknown) => {
  if (!error || typeof error !== "object") return false;
  const err = error as { status?: number; error?: { error_code?: string } };
  return err.status === 408 || err.error?.error_code === "REQUEST_TIMEOUT";
};

export const getScrapeErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unknown scrape error";
};

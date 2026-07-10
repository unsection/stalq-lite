import ContextDev from "context.dev";
import type { WebWebScrapeHTMLParams } from "context.dev/resources/web";

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

export type ScrapeHtmlResult = {
  html: string;
  url: string;
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

export const scrapeHtml = async (settings: ScrapeSettings): Promise<ScrapeHtmlResult> => {
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
    maxAgeMs: 0,
  };

  const response = await client.web.webScrapeHTML(params);

  return {
    html: response.html,
    url: response.url,
    creditsConsumed: response.key_metadata?.credits_consumed,
    creditsRemaining: response.key_metadata?.credits_remaining,
  };
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

import { DEFAULT_AI_MODEL } from "./constants";
import { parseAmount } from "../pricing/extractPriceFromHtml";

export type AiExtractedPrice = {
  price: number;
  currency: string;
};

export type ExtractPriceWithOpenRouterInput = {
  html: string;
  url: string;
  /** Full Context.dev scrape JSON when available — preferred over raw HTML alone. */
  scrapeResponse?: unknown;
  apiKey?: string | null;
  model?: string;
};

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_HTML_CHARS = 80_000;

const CURRENCY_PATTERN = /^(USD|EUR|GBP|CAD|AUD|JPY|INR|SGD|CHF|CNY|BRL)$/i;

const normalizeCurrency = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) return "USD";
  const upper = value.trim().toUpperCase();
  if (CURRENCY_PATTERN.test(upper)) return upper;
  if (upper === "$") return "USD";
  if (upper === "€") return "EUR";
  if (upper === "£") return "GBP";
  return "USD";
};

/**
 * Strip noise while keeping JSON-LD and visible price-bearing markup for the model.
 */
export const prepareHtmlForPriceExtraction = (html: string, maxChars = MAX_HTML_CHARS) => {
  const jsonLdBlocks: string[] = [];

  let prepared = html.replace(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    (_match, content: string) => {
      const trimmed = content.trim();
      if (trimmed) jsonLdBlocks.push(trimmed);
      return " ";
    },
  );

  prepared = prepared
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const withJsonLd = [
    ...jsonLdBlocks.map((block) => `<script type="application/ld+json">${block}</script>`),
    prepared,
  ]
    .filter(Boolean)
    .join("\n");

  if (withJsonLd.length <= maxChars) return withJsonLd;
  return withJsonLd.slice(0, maxChars);
};

const resolveApiKey = (override?: string | null) => {
  const key = override?.trim() || process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  return key;
};

const buildModelPayload = (input: ExtractPriceWithOpenRouterInput) => {
  const cleanedHtml = prepareHtmlForPriceExtraction(input.html);
  const scrape =
    input.scrapeResponse && typeof input.scrapeResponse === "object"
      ? (input.scrapeResponse as Record<string, unknown>)
      : null;

  if (!scrape) {
    return {
      url: input.url,
      html: cleanedHtml,
    };
  }

  return {
    success: scrape.success ?? true,
    url: typeof scrape.url === "string" ? scrape.url : input.url,
    type: scrape.type ?? "html",
    metadata: scrape.metadata ?? null,
    html: prepareHtmlForPriceExtraction(
      typeof scrape.html === "string" ? scrape.html : input.html,
    ),
  };
};

const SYSTEM_PROMPT = `You are a price extraction agent for competitor product pages.
You receive a Context.dev scrape JSON (metadata + HTML). Decide the current purchasable product price.

Rules:
- Return the current buyable/offer price for the main product on the page.
- Prefer JSON-LD Offer / Product prices, then Open Graph / visible main price.
- Ignore crossed-out list prices, monthly installments, shipping, tax-only amounts, and unrelated product prices.
- If no reliable price exists, return price as null.

Respond with JSON only:
{"price": number|null, "currency": "USD"|string|null, "evidence": string}`;

const parseModelJson = (content: string): { price: number | null; currency: string | null } => {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced?.[1]?.trim() ?? trimmed;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("OpenRouter did not return JSON");
  }

  const parsed = JSON.parse(raw.slice(start, end + 1)) as {
    price?: unknown;
    currency?: unknown;
  };

  return {
    price: parseAmount(parsed.price),
    currency: typeof parsed.currency === "string" ? parsed.currency : null,
  };
};

export const extractPriceWithOpenRouter = async (
  input: ExtractPriceWithOpenRouterInput,
): Promise<AiExtractedPrice> => {
  const apiKey = resolveApiKey(input.apiKey);
  const model = (input.model?.trim() || DEFAULT_AI_MODEL).trim();
  const payload = buildModelPayload(input);

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Stalq",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Scrape JSON for ${input.url}:\n${JSON.stringify(payload)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `OpenRouter request failed (${response.status})${errorText ? `: ${errorText.slice(0, 300)}` : ""}`,
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned an empty response");
  }

  const parsed = parseModelJson(content);
  if (parsed.price == null || parsed.price <= 0) {
    throw new Error("OpenRouter could not determine a product price");
  }

  return {
    price: parsed.price,
    currency: normalizeCurrency(parsed.currency),
  };
};

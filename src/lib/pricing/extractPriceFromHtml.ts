export type ExtractedPrice = {
  price: number;
  currency: string;
};

const CURRENCY_PATTERN = /^(USD|EUR|GBP|CAD|AUD|JPY|INR|SGD|CHF|CNY|BRL)$/i;

export const parseAmount = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const normalized = value.replace(/[^\d.,-]/g, "").replace(/,/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeCurrency = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) return "USD";
  const upper = value.trim().toUpperCase();
  if (CURRENCY_PATTERN.test(upper)) return upper;
  if (upper === "$") return "USD";
  if (upper === "€") return "EUR";
  if (upper === "£") return "GBP";
  return "USD";
};

export const stripHtmlTags = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const extractPriceFromText = (text: string): ExtractedPrice | null => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  const patterns: Array<{ regex: RegExp; currency: string }> = [
    { regex: /US\s*\$\s*([\d,]+(?:\.\d{1,2})?)/i, currency: "USD" },
    { regex: /CA\s*\$\s*([\d,]+(?:\.\d{1,2})?)/i, currency: "CAD" },
    { regex: /AU\s*\$\s*([\d,]+(?:\.\d{1,2})?)/i, currency: "AUD" },
    { regex: /\$\s*([\d,]+(?:\.\d{1,2})?)/, currency: "USD" },
    { regex: /£\s*([\d,]+(?:\.\d{1,2})?)/, currency: "GBP" },
    { regex: /€\s*([\d,]+(?:\.\d{1,2})?)/, currency: "EUR" },
    { regex: /\b(USD|EUR|GBP|CAD|AUD)\s*([\d,]+(?:\.\d{1,2})?)\b/i, currency: "" },
  ];

  for (const { regex, currency } of patterns) {
    const match = normalized.match(regex);
    if (!match) continue;

    const amount = match[2] ?? match[1];
    const price = parseAmount(amount);
    if (price == null) continue;

    return {
      price,
      currency: currency || normalizeCurrency(match[1]),
    };
  }

  const fallback = normalized.match(/([\d,]+\.\d{2})/);
  if (fallback) {
    const price = parseAmount(fallback[1]);
    if (price != null) {
      return { price, currency: "USD" };
    }
  }

  return null;
};

const fromOffer = (offer: Record<string, unknown>): ExtractedPrice | null => {
  const price =
    parseAmount(offer.price) ??
    parseAmount(offer.lowPrice) ??
    parseAmount(offer.highPrice);

  if (price == null) return null;

  return {
    price,
    currency: normalizeCurrency(offer.priceCurrency ?? offer.currency),
  };
};

const findPriceInJsonLd = (node: unknown): ExtractedPrice | null => {
  if (!node) return null;

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findPriceInJsonLd(item);
      if (found) return found;
    }
    return null;
  }

  if (typeof node !== "object") return null;

  const record = node as Record<string, unknown>;
  const typeValue = record["@type"];
  const types = Array.isArray(typeValue) ? typeValue : typeValue ? [typeValue] : [];
  const typeNames = types.map((t) => String(t).toLowerCase());

  if (typeNames.some((t) => t.includes("product"))) {
    const offers = record.offers;
    if (offers) {
      if (Array.isArray(offers)) {
        for (const offer of offers) {
          if (typeof offer === "object" && offer) {
            const found = fromOffer(offer as Record<string, unknown>);
            if (found) return found;
          }
        }
      } else if (typeof offers === "object") {
        const found = fromOffer(offers as Record<string, unknown>);
        if (found) return found;
      }
    }
  }

  if (typeNames.some((t) => t.includes("offer"))) {
    const found = fromOffer(record);
    if (found) return found;
  }

  if (record["@graph"]) {
    const found = findPriceInJsonLd(record["@graph"]);
    if (found) return found;
  }

  for (const value of Object.values(record)) {
    const found = findPriceInJsonLd(value);
    if (found) return found;
  }

  return null;
};

const extractMetaContent = (html: string, names: string[]) => {
  for (const name of names) {
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`,
      "i",
    );
    const match = html.match(pattern);
    if (match?.[1]) return match[1];

    const reversePattern = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`,
      "i",
    );
    const reverseMatch = html.match(reversePattern);
    if (reverseMatch?.[1]) return reverseMatch[1];
  }
  return null;
};

const extractItempropPrice = (html: string) => {
  const match = html.match(
    /itemprop=["']price["'][^>]*content=["']([^"']+)["']|itemprop=["']price["'][^>]*>([^<]+)</i,
  );
  return match?.[1] ?? match?.[2] ?? null;
};

const extractFromPriceClassElements = (html: string) => {
  const elementPattern =
    /<([a-z][a-z0-9]*)[^>]*class=["'][^"']*(?:price|amount|cost)[^"']*["'][^>]*>([\s\S]*?)<\/\1>/gi;

  let match = elementPattern.exec(html);
  while (match) {
    const innerText = stripHtmlTags(match[2]);
    const found = extractPriceFromText(innerText);
    if (found) return found;
    match = elementPattern.exec(html);
  }

  return null;
};

const extractClassBasedPrice = (html: string) => {
  const fromNested = extractFromPriceClassElements(html);
  if (fromNested) return fromNested;

  const patterns = [
    /class=["'][^"']*(?:price|amount|cost)[^"']*["'][^>]*>[\s$€£US]*([\d,.]+)/i,
    /data-price=["']([\d,.]+)["']/i,
    /"price"\s*:\s*"?([\d,.]+)"?/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const price = parseAmount(match[1]);
      if (price != null) return { price, currency: "USD" };
    }
  }

  return null;
};

export const extractPriceFromHtml = (html: string): ExtractedPrice | null => {
  const jsonLdMatches = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      const found = findPriceInJsonLd(data);
      if (found) return found;
    } catch {
      // continue
    }
  }

  const metaAmount =
    extractMetaContent(html, [
      "product:price:amount",
      "og:price:amount",
      "twitter:data1",
    ]) ?? extractItempropPrice(html);

  if (metaAmount) {
    const price = parseAmount(metaAmount) ?? extractPriceFromText(metaAmount)?.price ?? null;
    if (price != null) {
      const metaCurrency = extractMetaContent(html, [
        "product:price:currency",
        "og:price:currency",
      ]);
      return {
        price,
        currency: normalizeCurrency(metaCurrency ?? extractPriceFromText(metaAmount)?.currency),
      };
    }
  }

  const fromClasses = extractClassBasedPrice(html);
  if (fromClasses) return fromClasses;

  // Fallback for include-selector fragments (e.g. eBay .x-price-primary → "US $24.99")
  return extractPriceFromText(stripHtmlTags(html));
};

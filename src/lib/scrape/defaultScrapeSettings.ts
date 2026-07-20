/**
 * Defaults used when a competitor domain has no row in `website_scrape_settings`.
 */
export const UNREGISTERED_SITE_SCRAPE_DEFAULTS = {
  useMainContentOnly: true,
  settleAnimations: true,
  country: "us",
  waitForMs: 3000,
  timeoutEnabled: false,
  timeoutMs: null as number | null,
  includeSelectors: [] as string[],
  excludeSelectors: [] as string[],
  pdfShouldParse: false,
  maxAgeMs: 0,
} as const;

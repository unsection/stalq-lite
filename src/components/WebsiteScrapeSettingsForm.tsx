"use client";

import {
  BookOpen,
  CaretDown,
  CaretRight,
  Code,
  Globe,
  Plus,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type { WebsiteScrapeSetting } from "@/db/schema";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { COUNTRY_OPTIONS, TIMEOUT_AFTER_OPTIONS, WAIT_FOR_OPTIONS } from "@/lib/constants";
import { parseSelectorsInput } from "@/lib/dates";
import { cn, extractDomain, getFaviconUrl } from "@/lib/utils";
import type { ScrapeMethod, WebsiteScrapeSettingsInput } from "@/lib/validation";

type MethodSettings = WebsiteScrapeSettingsInput["settings"];
type FormValues = Omit<WebsiteScrapeSettingsInput, "settings"> & { settings: MethodSettings };

const emptySettings: MethodSettings = {
  country: null,
  waitForMs: null,
  timeoutMs: null,
  maxAgeMs: 0,
  headers: {},
  useMainContentOnly: false,
  settleAnimations: false,
  includeSelectors: [],
  excludeSelectors: [],
  includeFrames: false,
  pdfStart: null,
  pdfEnd: null,
  pdfShouldParse: false,
  colorScheme: null,
  fullScreenshot: false,
  handleCookiePopup: false,
  scrollOffset: null,
  viewportWidth: null,
  viewportHeight: null,
  factCheck: true,
  followSubdomains: false,
  instructions: null,
  maxDepth: 0,
  maxPages: 1,
  stopAfterMs: null,
};

const initialForm = (): FormValues => ({
  name: "",
  domain: "",
  method: "html",
  settings: { ...emptySettings },
});

const methodLabels: Record<ScrapeMethod, string> = {
  html: "Scrape HTML",
  extract: "Extract price",
  screenshot: "Get screenshot",
};

const fieldClass =
  "w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600";

const parseHeaders = (value: string) =>
  Object.fromEntries(
    value.split("\n").flatMap((line) => {
      const separator = line.indexOf(":");
      if (separator < 1) return [];
      const key = line.slice(0, separator).trim();
      const headerValue = line.slice(separator + 1).trim();
      return key && headerValue ? [[key, headerValue]] : [];
    }),
  );

const numberOrNull = (value: string) => (value === "" ? null : Number(value));

export const WebsiteScrapeSettingsForm = () => {
  const [websites, setWebsites] = useState<WebsiteScrapeSetting[]>([]);
  const [values, setValues] = useState<FormValues>(initialForm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [includeInput, setIncludeInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");
  const [headersInput, setHeadersInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contentOpen, setContentOpen] = useState(true);
  const [locationOpen, setLocationOpen] = useState(true);

  const load = async () => {
    const response = await fetch("/api/settings/websites");
    if (!response.ok) throw new Error("Failed to load website rules");
    setWebsites(await response.json());
  };

  useEffect(() => {
    const loadInitialWebsites = async () => {
      try {
        await load();
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load");
      } finally {
        setIsLoading(false);
      }
    };
    void loadInitialWebsites();
  }, []);

  const updateSettings = (patch: Partial<MethodSettings>) =>
    setValues((current) => ({ ...current, settings: { ...current.settings, ...patch } }));

  const startNew = () => {
    setSelectedId(null);
    setValues(initialForm());
    setIncludeInput("");
    setExcludeInput("");
    setHeadersInput("");
    setError(null);
    setMessage(null);
    setContentOpen(true);
    setLocationOpen(true);
  };

  const edit = (website: WebsiteScrapeSetting) => {
    const settings = { ...emptySettings, ...(website.settings as Partial<MethodSettings>) };
    setSelectedId(website.id);
    setValues({
      name: website.name,
      domain: website.domain,
      method: website.method as ScrapeMethod,
      settings,
    });
    setIncludeInput((settings.includeSelectors ?? []).join("\n"));
    setExcludeInput((settings.excludeSelectors ?? []).join("\n"));
    setHeadersInput(
      Object.entries(settings.headers ?? {})
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n"),
    );
    setError(null);
    setMessage(null);
    setContentOpen(true);
    setLocationOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);
    const payload = {
      ...values,
      settings: {
        ...values.settings,
        includeSelectors: parseSelectorsInput(includeInput),
        excludeSelectors: parseSelectorsInput(excludeInput),
        headers: parseHeaders(headersInput),
      },
    };
    try {
      const response = await fetch(
        selectedId ? `/api/settings/websites/${selectedId}` : "/api/settings/websites",
        {
          method: selectedId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "Failed to save website rule");
      }
      const saved: WebsiteScrapeSetting = await response.json();
      await load();
      setSelectedId(saved.id);
      setMessage("Website rule saved. It will be used the next time products from this website are checked.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    if (
      !selectedId ||
      !confirm(
        "Delete this website rule? Products from this website will use their own existing settings again.",
      )
    ) {
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(`/api/settings/websites/${selectedId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete website rule");
      await load();
      startNew();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete");
    } finally {
      setIsSaving(false);
    }
  };

  const setting = values.settings;
  const showLocation = values.method === "html" || values.method === "screenshot";
  const methodSectionTitle =
    values.method === "html"
      ? "Content and selectors"
      : values.method === "screenshot"
        ? "Screenshot options"
        : "Extract price options";
  const methodSectionDescription =
    values.method === "html"
      ? "Controls for Context.dev Scrape HTML."
      : values.method === "screenshot"
        ? "Context captures the exact tracked product URL."
        : "Stalq supplies a fixed price and currency schema.";

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
      <aside className="flex min-h-[28rem] flex-col rounded-xl border border-zinc-900 bg-zinc-950">
        <div className="space-y-1 border-b border-zinc-900 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-medium text-white">Website rules</h2>
            <Button
              type="button"
              variant="secondary"
              onClick={startNew}
              aria-label="Add website rule"
              className="gap-1 border-[#0080FF]/40 text-[#0080FF] hover:border-[#0080FF] hover:bg-[#0080FF]/10 hover:text-[#4da3ff]"
            >
              <Plus className="h-3.5 w-3.5" weight="bold" />
              Add rule
            </Button>
          </div>
          <p className="text-xs text-zinc-500">
            One rule applies to each tracked product from that domain.
          </p>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {isLoading ? <p className="px-2 py-3 text-sm text-zinc-500">Loading websites...</p> : null}
          {!isLoading && websites.length === 0 ? (
            <p className="px-2 py-3 text-sm text-zinc-500">No website rules yet. Add one to get started.</p>
          ) : null}
          {websites.map((website) => {
            const isSelected = selectedId === website.id;
            const domain = extractDomain(website.domain);
            return (
              <button
                key={website.id}
                type="button"
                onClick={() => edit(website)}
                aria-current={isSelected ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                  isSelected
                    ? "border-[#0080FF] bg-zinc-900"
                    : "border-transparent hover:bg-zinc-900/70",
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getFaviconUrl(domain, 64)}
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5"
                    loading="lazy"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{website.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-zinc-500">
                    {domain} · {methodLabels[website.method as ScrapeMethod] ?? website.method}
                  </span>
                </div>
                <CaretRight className="h-4 w-4 shrink-0 text-zinc-600" />
              </button>
            );
          })}
        </div>

        <div className="mt-auto border-t border-zinc-900 p-3">
          <div className="flex items-start gap-3 rounded-lg border border-zinc-900 bg-zinc-900/50 px-3 py-3">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm text-zinc-300">Learn about website rules</p>
              <a
                href="https://context.dev"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#0080FF] hover:underline"
              >
                See docs
                <CaretRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </aside>

      <form
        onSubmit={save}
        className="space-y-4 rounded-xl border border-zinc-900 bg-zinc-950 p-5 sm:p-6"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-white">
              {selectedId ? "Edit website rule" : "Add website rule"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Define how prices are scraped and how Context.dev makes requests.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {selectedId ? (
              <Button type="button" variant="ghost" onClick={remove} disabled={isSaving}>
                Delete
              </Button>
            ) : null}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save rule"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="text-sm text-zinc-400">Website name</span>
            <input
              required
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              placeholder="Amazon"
              className={fieldClass}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-zinc-400">Website or domain</span>
            <input
              required
              value={values.domain}
              onChange={(event) =>
                setValues((current) => ({ ...current, domain: event.target.value }))
              }
              placeholder="amazon.com or https://amazon.com"
              className={fieldClass}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-zinc-400">Price method</span>
            <select
              value={values.method}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  method: event.target.value as ScrapeMethod,
                }))
              }
              className={fieldClass}
            >
              <option value="html">Scrape HTML — use selectors and page content</option>
              <option value="extract">Extract price — Context.dev returns structured price data</option>
              <option value="screenshot">Get Screenshot — save a visual capture for checking</option>
            </select>
          </label>
        </div>

        <CollapsibleCard
          open={contentOpen}
          onToggle={() => setContentOpen((open) => !open)}
          icon={<Code className="h-4 w-4" />}
          title={methodSectionTitle}
          description={methodSectionDescription}
        >
          {values.method === "html" ? (
            <div className="space-y-4">
              <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
                <Toggle
                  id="siteMainContent"
                  label="Main content only"
                  description="Drop navigation, footer and sidebars when Context can identify them."
                  checked={Boolean(setting.useMainContentOnly)}
                  onChange={(checked) => updateSettings({ useMainContentOnly: checked })}
                />
                <Toggle
                  id="siteSettleAnimations"
                  label="Settle animations"
                  description="Wait for CSS transitions before reading the page; this can make each check slower."
                  checked={Boolean(setting.settleAnimations)}
                  onChange={(checked) => updateSettings({ settleAnimations: checked })}
                />
                <Toggle
                  id="siteIncludeFrames"
                  label="Include iframes"
                  description="Render embedded iframe content into the returned HTML."
                  checked={Boolean(setting.includeFrames)}
                  onChange={(checked) => updateSettings({ includeFrames: checked })}
                />
                <Toggle
                  id="sitePdf"
                  label="Parse PDF pages"
                  description="Enable PDF parsing when this website's product URLs point to PDF documents."
                  checked={Boolean(setting.pdfShouldParse)}
                  onChange={(checked) => updateSettings({ pdfShouldParse: checked })}
                />
              </div>
              {setting.pdfShouldParse ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <NumberField
                    label="First PDF page"
                    value={setting.pdfStart}
                    min={1}
                    onChange={(value) => updateSettings({ pdfStart: value })}
                  />
                  <NumberField
                    label="Last PDF page"
                    value={setting.pdfEnd}
                    min={1}
                    onChange={(value) => updateSettings({ pdfEnd: value })}
                  />
                </div>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm text-zinc-400">Include selectors</span>
                  <textarea
                    value={includeInput}
                    onChange={(event) => setIncludeInput(event.target.value)}
                    rows={4}
                    placeholder={".a-price\n#corePriceDisplay"}
                    className={fieldClass}
                  />
                  <span className="text-xs text-zinc-500">
                    One CSS selector per line. Everything else is removed.
                  </span>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-zinc-400">Exclude selectors</span>
                  <textarea
                    value={excludeInput}
                    onChange={(event) => setExcludeInput(event.target.value)}
                    rows={4}
                    placeholder={"nav\nfooter\n.ad-banner"}
                    className={fieldClass}
                  />
                  <span className="text-xs text-zinc-500">
                    Exclusions take priority when a selector appears in both lists.
                  </span>
                </label>
              </div>
            </div>
          ) : null}

          {values.method === "screenshot" ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <label className="block space-y-2">
                  <span className="text-sm text-zinc-400">Colour scheme</span>
                  <select
                    value={setting.colorScheme ?? ""}
                    onChange={(event) =>
                      updateSettings({
                        colorScheme: event.target.value
                          ? (event.target.value as "light" | "dark")
                          : null,
                      })
                    }
                    className={fieldClass}
                  >
                    <option value="">Website default</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-zinc-400">Scroll offset (pixels)</span>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    value={setting.scrollOffset ?? ""}
                    onChange={(event) =>
                      updateSettings({ scrollOffset: numberOrNull(event.target.value) })
                    }
                    placeholder="0"
                    className={fieldClass}
                  />
                  <span className="text-xs text-zinc-500">
                    Captures one viewport-sized slice and overrides full-page mode.
                  </span>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-zinc-400">Viewport width</span>
                  <input
                    type="number"
                    min="1"
                    value={setting.viewportWidth ?? ""}
                    onChange={(event) =>
                      updateSettings({ viewportWidth: numberOrNull(event.target.value) })
                    }
                    placeholder="1920"
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-zinc-400">Viewport height</span>
                  <input
                    type="number"
                    min="1"
                    value={setting.viewportHeight ?? ""}
                    onChange={(event) =>
                      updateSettings({ viewportHeight: numberOrNull(event.target.value) })
                    }
                    placeholder="1080"
                    className={fieldClass}
                  />
                </label>
              </div>
              <div className="grid gap-x-6 sm:grid-cols-2">
                <Toggle
                  id="siteFullScreenshot"
                  label="Full-page screenshot"
                  description="Capture the complete page instead of the initial browser viewport."
                  checked={Boolean(setting.fullScreenshot)}
                  onChange={(checked) => updateSettings({ fullScreenshot: checked })}
                />
                <Toggle
                  id="siteCookiePopup"
                  label="Dismiss cookie popup"
                  description="Ask Context.dev to close a consent banner before capturing."
                  checked={Boolean(setting.handleCookiePopup)}
                  onChange={(checked) => updateSettings({ handleCookiePopup: checked })}
                />
              </div>
            </div>
          ) : null}

          {values.method === "extract" ? (
            <div className="space-y-4">
              <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 xl:grid-cols-3">
                <Toggle
                  id="siteFactCheck"
                  label="Fact-check results"
                  description="Return only price data that Context.dev can support from the page."
                  checked={setting.factCheck !== false}
                  onChange={(checked) => updateSettings({ factCheck: checked })}
                />
                <Toggle
                  id="siteFollowSubdomains"
                  label="Follow subdomains"
                  description="Allow extraction to follow links on subdomains of this website."
                  checked={Boolean(setting.followSubdomains)}
                  onChange={(checked) => updateSettings({ followSubdomains: checked })}
                />
                <Toggle
                  id="siteExtractFrames"
                  label="Include iframes"
                  description="Include iframe content before extracting the price."
                  checked={Boolean(setting.includeFrames)}
                  onChange={(checked) => updateSettings({ includeFrames: checked })}
                />
                <Toggle
                  id="sitePdf"
                  label="Parse PDF pages"
                  description="Enable PDF parsing when this website's product URLs point to PDF documents."
                  checked={Boolean(setting.pdfShouldParse)}
                  onChange={(checked) => updateSettings({ pdfShouldParse: checked })}
                />
              </div>
              {setting.pdfShouldParse ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <NumberField
                    label="First PDF page"
                    value={setting.pdfStart}
                    min={1}
                    onChange={(value) => updateSettings({ pdfStart: value })}
                  />
                  <NumberField
                    label="Last PDF page"
                    value={setting.pdfEnd}
                    min={1}
                    onChange={(value) => updateSettings({ pdfEnd: value })}
                  />
                </div>
              ) : null}
              <label className="block space-y-2">
                <span className="text-sm text-zinc-400">Extraction instructions</span>
                <textarea
                  value={setting.instructions ?? ""}
                  onChange={(event) =>
                    updateSettings({ instructions: event.target.value || null })
                  }
                  rows={3}
                  placeholder="Use the regular sale price shown on the product page, not a crossed-out list price."
                  className={fieldClass}
                />
              </label>
              <div className="grid gap-4 md:grid-cols-3">
                <NumberField
                  label="Max link depth"
                  value={setting.maxDepth}
                  min={0}
                  onChange={(value) => updateSettings({ maxDepth: value })}
                />
                <NumberField
                  label="Max pages (1–50)"
                  value={setting.maxPages}
                  min={1}
                  max={50}
                  onChange={(value) => updateSettings({ maxPages: value })}
                />
                <NumberField
                  label="Crawl time budget (ms)"
                  value={setting.stopAfterMs}
                  min={10000}
                  max={110000}
                  onChange={(value) => updateSettings({ stopAfterMs: value })}
                />
              </div>
            </div>
          ) : null}
        </CollapsibleCard>

        <CollapsibleCard
          open={locationOpen}
          onToggle={() => setLocationOpen((open) => !open)}
          icon={<Globe className="h-4 w-4" />}
          title="Location and performance"
          description="Context.dev request controls and caching."
        >
          <div className="space-y-4">
            {showLocation ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <label className="block space-y-2">
                  <span className="text-sm text-zinc-400">Country</span>
                  <select
                    value={setting.country ?? ""}
                    onChange={(event) => updateSettings({ country: event.target.value || null })}
                    className={fieldClass}
                  >
                    {COUNTRY_OPTIONS.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-zinc-400">Wait after page load</span>
                  <select
                    value={setting.waitForMs ?? ""}
                    onChange={(event) =>
                      updateSettings({ waitForMs: numberOrNull(event.target.value) })
                    }
                    className={fieldClass}
                  >
                    {WAIT_FOR_OPTIONS.map((option) => (
                      <option key={option.label} value={option.value ?? ""}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-zinc-400">Request timeout</span>
                  <select
                    value={setting.timeoutMs ?? ""}
                    onChange={(event) =>
                      updateSettings({ timeoutMs: numberOrNull(event.target.value) })
                    }
                    className={fieldClass}
                  >
                    <option value="">Context default</option>
                    {TIMEOUT_AFTER_OPTIONS.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-zinc-400">Cache age (milliseconds)</span>
                  <input
                    type="number"
                    min="0"
                    max="2592000000"
                    value={setting.maxAgeMs ?? ""}
                    onChange={(event) =>
                      updateSettings({ maxAgeMs: numberOrNull(event.target.value) })
                    }
                    placeholder="0 for fresh"
                    className={fieldClass}
                  />
                </label>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <label className="block space-y-2">
                  <span className="text-sm text-zinc-400">Wait after page load (ms)</span>
                  <input
                    type="number"
                    min="0"
                    max="30000"
                    value={setting.waitForMs ?? ""}
                    onChange={(event) =>
                      updateSettings({ waitForMs: numberOrNull(event.target.value) })
                    }
                    className={fieldClass}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-zinc-400">Request timeout</span>
                  <select
                    value={setting.timeoutMs ?? ""}
                    onChange={(event) =>
                      updateSettings({ timeoutMs: numberOrNull(event.target.value) })
                    }
                    className={fieldClass}
                  >
                    <option value="">Context default</option>
                    {TIMEOUT_AFTER_OPTIONS.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-zinc-400">Cache age (milliseconds)</span>
                  <input
                    type="number"
                    min="0"
                    max="2592000000"
                    value={setting.maxAgeMs ?? ""}
                    onChange={(event) =>
                      updateSettings({ maxAgeMs: numberOrNull(event.target.value) })
                    }
                    placeholder="0 for fresh"
                    className={fieldClass}
                  />
                </label>
              </div>
            )}

            {values.method === "html" ? (
              <label className="block space-y-2">
                <span className="text-sm text-zinc-400">Request headers</span>
                <textarea
                  value={headersInput}
                  onChange={(event) => setHeadersInput(event.target.value)}
                  rows={3}
                  placeholder={"Accept-Language: en-US\nX-Custom-Header: value"}
                  className={cn(fieldClass, "font-mono")}
                />
                <span className="text-xs text-zinc-500">
                  One “Header: value” per line. Using custom headers bypasses Context.dev’s cache.
                </span>
              </label>
            ) : null}
          </div>
        </CollapsibleCard>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
      </form>
    </div>
  );
};

const CollapsibleCard = ({
  open,
  onToggle,
  icon,
  title,
  description,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) => (
  <section className="overflow-hidden rounded-xl border border-zinc-900 bg-zinc-900/40">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-900/60"
    >
      <span className="mt-0.5 text-zinc-400">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-white">{title}</span>
        <span className="mt-0.5 block text-xs text-zinc-500">{description}</span>
      </span>
      <CaretDown
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0 text-zinc-500 transition-transform",
          open && "rotate-180",
        )}
      />
    </button>
    {open ? <div className="border-t border-zinc-900 px-4 py-4">{children}</div> : null}
  </section>
);

const NumberField = ({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number | null | undefined;
  min: number;
  max?: number;
  onChange: (value: number | null) => void;
}) => (
  <label className="block space-y-2">
    <span className="text-sm text-zinc-400">{label}</span>
    <input
      type="number"
      min={min}
      max={max}
      value={value ?? ""}
      onChange={(event) => onChange(numberOrNull(event.target.value))}
      className={fieldClass}
    />
  </label>
);

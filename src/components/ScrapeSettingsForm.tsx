"use client";

import { useState } from "react";
import {
  COUNTRY_OPTIONS,
  TIMEOUT_AFTER_OPTIONS,
  WAIT_FOR_OPTIONS,
} from "@/lib/constants";
import type { ProductInput } from "@/lib/validation";
import { parseSelectorsInput } from "@/lib/dates";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";

const defaultValues: ProductInput = {
  name: "",
  url: "",
  useMainContentOnly: false,
  settleAnimations: false,
  includeSelectors: [],
  excludeSelectors: [],
  country: "",
  waitForMs: null,
  timeoutEnabled: false,
  timeoutMs: 30000,
};

type ScrapeSettingsFormProps = {
  initialValues?: Partial<ProductInput>;
  submitLabel: string;
  onSubmit: (values: ProductInput) => Promise<void>;
};

export const ScrapeSettingsForm = ({
  initialValues,
  submitLabel,
  onSubmit,
}: ScrapeSettingsFormProps) => {
  const [values, setValues] = useState<ProductInput>({
    ...defaultValues,
    ...initialValues,
    includeSelectors: initialValues?.includeSelectors ?? [],
    excludeSelectors: initialValues?.excludeSelectors ?? [],
  });
  const [includeInput, setIncludeInput] = useState(
    (initialValues?.includeSelectors ?? []).join("\n"),
  );
  const [excludeInput, setExcludeInput] = useState(
    (initialValues?.excludeSelectors ?? []).join("\n"),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        ...values,
        includeSelectors: parseSelectorsInput(includeInput),
        excludeSelectors: parseSelectorsInput(excludeInput),
        country: values.country || null,
        timeoutMs: values.timeoutEnabled ? values.timeoutMs ?? 30000 : null,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium text-white">Product</h2>
          <p className="text-sm text-zinc-500">Basic product details to monitor.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm text-zinc-400">Name</span>
            <input
              required
              value={values.name}
              onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
              placeholder="Competitor widget"
            />
          </label>
          <label className="block space-y-2 md:col-span-2">
            <span className="text-sm text-zinc-400">Product URL</span>
            <input
              required
              type="url"
              value={values.url}
              onChange={(event) => setValues((prev) => ({ ...prev, url: event.target.value }))}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
              placeholder="https://example.com/product"
            />
          </label>
        </div>
      </section>

      <section className="space-y-2 border-t border-zinc-900 pt-6">
        <div>
          <h2 className="text-lg font-medium text-white">Scrape settings</h2>
          <p className="text-sm text-zinc-500">
            Context.dev HTML scrape parameters for this product.
          </p>
        </div>

        <Toggle
          id="useMainContentOnly"
          label="Main Content Only"
          description="Return only the page's main content, excluding nav and footers."
          checked={values.useMainContentOnly}
          onChange={(checked) => setValues((prev) => ({ ...prev, useMainContentOnly: checked }))}
        />

        <Toggle
          id="settleAnimations"
          label="Settle Animations"
          description="Wait for CSS transitions to settle before extracting HTML."
          checked={values.settleAnimations}
          onChange={(checked) => setValues((prev) => ({ ...prev, settleAnimations: checked }))}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm text-zinc-400">Include Selectors</span>
            <textarea
              value={includeInput}
              onChange={(event) => setIncludeInput(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
              placeholder={"article.main\n#content"}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-zinc-400">Exclude Selectors</span>
            <textarea
              value={excludeInput}
              onChange={(event) => setExcludeInput(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
              placeholder={"nav\nfooter\n.ad-banner"}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block space-y-2">
            <span className="text-sm text-zinc-400">Country</span>
            <select
              value={values.country ?? ""}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, country: event.target.value || null }))
              }
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
            >
              {COUNTRY_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-400">Wait for</span>
            <select
              value={values.waitForMs ?? ""}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  waitForMs: event.target.value ? Number(event.target.value) : null,
                }))
              }
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
            >
              {WAIT_FOR_OPTIONS.map((option) => (
                <option key={option.label} value={option.value ?? ""}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Toggle
          id="timeoutEnabled"
          label="Timeout"
          description="Abort the scrape if it exceeds the configured duration."
          checked={values.timeoutEnabled}
          onChange={(checked) => setValues((prev) => ({ ...prev, timeoutEnabled: checked }))}
        />

        {values.timeoutEnabled ? (
          <label className="block max-w-xs space-y-2">
            <span className="text-sm text-zinc-400">Timeout after</span>
            <select
              value={values.timeoutMs ?? 30000}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, timeoutMs: Number(event.target.value) }))
              }
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
            >
              {TIMEOUT_AFTER_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </section>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
};

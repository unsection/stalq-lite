"use client";

import { useEffect, useId, useState, type KeyboardEvent, type MouseEvent } from "react";
import { Copy, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

type ScrapedHtmlModalProps = {
  open: boolean;
  logId: string | null;
  productLabel: string;
  onClose: () => void;
};

/** Match Context.dev playground field order. */
const PLAYGROUND_KEY_ORDER = [
  "success",
  "html",
  "url",
  "type",
  "metadata",
  "key_metadata",
] as const;

const HTML_PREVIEW_CHARS = 180;

const orderPlaygroundKeys = (value: Record<string, unknown>) => {
  const ordered: Record<string, unknown> = {};
  for (const key of PLAYGROUND_KEY_ORDER) {
    if (key in value) ordered[key] = value[key];
  }
  for (const key of Object.keys(value)) {
    if (!(key in ordered)) ordered[key] = value[key];
  }
  return ordered;
};

/** Truncate the html field so metadata stays visible like the playground. */
const previewForDisplay = (
  payload: Record<string, unknown>,
  expandHtml: boolean,
): Record<string, unknown> => {
  const html = payload.html;
  if (typeof html !== "string" || expandHtml || html.length <= HTML_PREVIEW_CHARS) {
    return payload;
  }
  return {
    ...payload,
    html: `${html.slice(0, HTML_PREVIEW_CHARS)}…`,
  };
};

export const ScrapedHtmlModal = ({ open, logId, productLabel, onClose }: ScrapedHtmlModalProps) => {
  const titleId = useId();
  const [fullPayload, setFullPayload] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandHtml, setExpandHtml] = useState(false);

  useEffect(() => {
    if (!open || !logId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setFullPayload(null);
    setCopied(false);
    setExpandHtml(false);

    const load = async () => {
      try {
        const response = await fetch(`/api/logs/${logId}/html`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.message ?? "Failed to load scrape response");
        }
        if (!cancelled) {
          const payload =
            data.response && typeof data.response === "object"
              ? orderPlaygroundKeys(data.response as Record<string, unknown>)
              : null;
          setFullPayload(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load scrape response",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, logId]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleBackdropKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClose();
    }
  };

  const fullJsonText = fullPayload ? JSON.stringify(fullPayload, null, 2) : null;
  const displayJsonText = fullPayload
    ? JSON.stringify(previewForDisplay(fullPayload, expandHtml), null, 2)
    : null;
  const htmlLength =
    fullPayload && typeof fullPayload.html === "string" ? fullPayload.html.length : 0;
  const canToggleHtml = htmlLength > HTML_PREVIEW_CHARS;

  const handleCopy = async () => {
    if (!fullJsonText) return;
    try {
      await navigator.clipboard.writeText(fullJsonText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy to clipboard");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 py-8"
      role="presentation"
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-medium text-white">
              Scrape response (JSON)
            </h2>
            <p className="mt-0.5 truncate text-sm text-zinc-500">{productLabel}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {canToggleHtml ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setExpandHtml((value) => !value)}
                aria-label={expandHtml ? "Collapse HTML field" : "Expand full HTML field"}
              >
                {expandHtml ? "Collapse HTML" : "Expand HTML"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={handleCopy}
              disabled={!fullJsonText || isLoading}
              aria-label="Copy full scrape response JSON"
            >
              <Copy className="mr-1.5 h-4 w-4" />
              {copied ? "Copied" : "Copy"}
            </Button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close scrape response dialog"
              className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white"
            >
              <X className="h-5 w-5" weight="bold" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {isLoading ? (
            <p className="text-sm text-zinc-500">Loading scrape response…</p>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : (
            <pre className="whitespace-pre-wrap break-all rounded-xl border border-zinc-800 bg-zinc-900 p-4 font-mono text-xs leading-relaxed text-zinc-300">
              {displayJsonText}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

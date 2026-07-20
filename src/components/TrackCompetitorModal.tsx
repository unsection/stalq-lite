"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";

type TrackCompetitorModalProps = {
  open: boolean;
  ownProductName: string;
  onClose: () => void;
  onSubmit: (url: string) => Promise<void>;
};

export const TrackCompetitorModal = ({
  open,
  ownProductName,
  onClose,
  onSubmit,
}: TrackCompetitorModalProps) => {
  const titleId = useId();
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setUrl("");
      setError(null);
    }
  }

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => urlInputRef.current?.focus(), 0);
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(timer);
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste a competitor URL");
      return;
    }

    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }

    try {
      // Validate early so we can show a friendly error before dismissing.
      new URL(normalized);
    } catch {
      setError("Enter a valid URL");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(normalized);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to add competitor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[12vh]"
      role="presentation"
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50"
      >
        <div className="flex items-center justify-between px-5 py-4">
          <h2 id={titleId} className="text-lg font-medium text-white">
            Track a competitor
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close track competitor dialog"
            className="rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-white"
          >
            <X className="h-5 w-5" weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-5">
          <label className="block space-y-2">
            <span className="sr-only">Competitor URL</span>
            <input
              ref={urlInputRef}
              required
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="w-full rounded-xl border border-[#0080FF] bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-[#0080FF] focus:ring-1 focus:ring-[#0080FF]/40"
              placeholder={`Paste competitor URL for ${ownProductName}`}
              aria-label={`Paste competitor URL for ${ownProductName}`}
            />
          </label>

          <p className="text-sm leading-relaxed text-zinc-500">
            We&apos;ll add the card right away and scrape the page in the background. You can
            confirm or re-scrape from the card itself.
          </p>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <div className="flex items-center justify-end pt-1">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add competitor"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

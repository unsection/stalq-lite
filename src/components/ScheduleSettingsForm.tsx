"use client";

import { format } from "date-fns";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import type { ScheduleSettings } from "@/db/schema";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { FREQUENCY_OPTIONS, TIMEZONE_OPTIONS } from "@/lib/schedule/constants";

export const ScheduleSettingsForm = () => {
  const [settings, setSettings] = useState<ScheduleSettings | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState<1 | 2>(1);
  const [primaryTime, setPrimaryTime] = useState("09:00");
  const [secondaryTime, setSecondaryTime] = useState("21:00");
  const [timezone, setTimezone] = useState("Asia/Bangkok");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/settings/schedule");
        if (!response.ok) {
          throw new Error("Failed to load schedule settings");
        }
        const data: ScheduleSettings = await response.json();
        setSettings(data);
        setEnabled(data.enabled);
        setFrequency(data.frequency === 2 ? 2 : 1);
        setPrimaryTime(data.primaryTime);
        setSecondaryTime(data.secondaryTime ?? "21:00");
        setTimezone(data.timezone);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/settings/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          frequency,
          primaryTime,
          secondaryTime: frequency === 2 ? secondaryTime : null,
          timezone,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message ?? "Failed to save settings");
      }

      const data: ScheduleSettings = await response.json();
      setSettings(data);
      setMessage("Schedule saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunNow = async () => {
    setIsRunning(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/products/scrape-all", { method: "POST" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message ?? "Failed to run scrape");
      }

      const payload = await response.json();
      setMessage(
        `Scraped ${payload.summary.total} products (${payload.summary.success} success, ${payload.summary.no_price} no price, ${payload.summary.error + payload.summary.timeout} failed).`,
      );
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Failed to run scrape");
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Loading schedule settings...</p>;
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSave} className="space-y-6">
        <Toggle
          id="scheduleEnabled"
          label="Enable scheduled checks"
          description="When enabled, the hourly cron will scrape all products at your configured times."
          checked={enabled}
          onChange={setEnabled}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm text-zinc-400">Frequency</span>
            <select
              value={frequency}
              onChange={(event) => setFrequency(Number(event.target.value) as 1 | 2)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
            >
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-400">Timezone</span>
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
            >
              {TIMEZONE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm text-zinc-400">Primary time</span>
            <input
              type="time"
              value={primaryTime}
              onChange={(event) => setPrimaryTime(event.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
              required
            />
          </label>

          {frequency === 2 ? (
            <label className="block space-y-2">
              <span className="text-sm text-zinc-400">Secondary time</span>
              <input
                type="time"
                value={secondaryTime}
                onChange={(event) => setSecondaryTime(event.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
                required
              />
            </label>
          ) : null}
        </div>

        {settings?.lastRunAt ? (
          <div className="rounded-md border border-zinc-900 bg-black px-4 py-3 text-sm text-zinc-400">
            <p>
              Last run:{" "}
              <span className="text-zinc-200">
                {format(new Date(settings.lastRunAt), "MMM d, yyyy hh:mm a")}
              </span>
            </p>
            {settings.lastRunSlot ? (
              <p className="mt-1">
                Slot: <span className="text-zinc-200">{settings.lastRunSlot}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save schedule"}
          </Button>
          <Button type="button" variant="secondary" onClick={handleRunNow} disabled={isRunning}>
            <ArrowsClockwise className={`mr-1.5 h-3.5 w-3.5 ${isRunning ? "animate-spin" : ""}`} />
            {isRunning ? "Scraping..." : "Run all now"}
          </Button>
        </div>
      </form>

      <div className="rounded-md border border-zinc-900 bg-zinc-950 px-4 py-3 text-xs text-zinc-500">
        <p className="font-medium text-zinc-400">How scheduling works</p>
        <p className="mt-2">
          A GitHub Action calls <code className="text-zinc-300">/api/cron/scrape-all</code> every
          hour. After a configured time passes, the next cron hit scrapes all
          products once for that slot (catch-up if the runner is late).
        </p>
      </div>
    </div>
  );
};

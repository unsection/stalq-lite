"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { AiSettingsForm } from "@/components/AiSettingsForm";
import { ScheduleSettingsForm } from "@/components/ScheduleSettingsForm";
import { WebsiteScrapeSettingsForm } from "@/components/WebsiteScrapeSettingsForm";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "websites", label: "Website rules" },
  { id: "schedule", label: "Scheduled checks" },
  { id: "ai", label: "AI" },
] as const;

type SettingsTab = (typeof tabs)[number]["id"];

const isSettingsTab = (value: string | null): value is SettingsTab =>
  tabs.some((tab) => tab.id === value);

export const SettingsPageClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const tab = isSettingsTab(searchParams.get("tab")) ? searchParams.get("tab")! : "websites";

  const handleTabChange = (nextTab: SettingsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nextTab);
    startTransition(() => {
      router.push(`/settings?${params.toString()}`);
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configure website scrape rules, scheduled checks, and OpenRouter AI.
        </p>
      </div>

      <div className="border-b border-zinc-900">
        <div className="flex items-center gap-6" role="tablist" aria-label="Settings sections">
          {tabs.map((item) => {
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`settings-tab-${item.id}`}
                aria-selected={isActive}
                aria-controls={`settings-panel-${item.id}`}
                tabIndex={isActive ? 0 : -1}
                disabled={isPending}
                onClick={() => handleTabChange(item.id)}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                  event.preventDefault();
                  const index = tabs.findIndex((entry) => entry.id === item.id);
                  const nextIndex =
                    event.key === "ArrowRight"
                      ? (index + 1) % tabs.length
                      : (index - 1 + tabs.length) % tabs.length;
                  handleTabChange(tabs[nextIndex].id);
                }}
                className={cn(
                  "border-b-2 px-1 pb-3 text-sm transition-colors",
                  isActive
                    ? "border-[#0080FF] text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`settings-panel-${tab}`}
        aria-labelledby={`settings-tab-${tab}`}
        className={cn(tab !== "websites" && "rounded-lg border border-zinc-900 bg-zinc-950 p-6")}
      >
        {tab === "websites" ? (
          <WebsiteScrapeSettingsForm />
        ) : tab === "schedule" ? (
          <ScheduleSettingsForm />
        ) : (
          <AiSettingsForm />
        )}
      </div>
    </div>
  );
};

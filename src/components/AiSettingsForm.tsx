"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DEFAULT_AI_MODEL } from "@/lib/ai/constants";

type AiSettingsResponse = {
  id: string;
  model: string;
  hasApiKey: boolean;
  updatedAt: string;
};

const fieldClass =
  "w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600";

export const AiSettingsForm = () => {
  const [model, setModel] = useState(DEFAULT_AI_MODEL);
  const [openrouterApiKey, setOpenrouterApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/settings/ai");
        if (!response.ok) {
          throw new Error("Failed to load AI settings");
        }
        const data: AiSettingsResponse = await response.json();
        setModel(data.model || DEFAULT_AI_MODEL);
        setHasApiKey(data.hasApiKey);
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
      const response = await fetch("/api/settings/ai", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openrouterApiKey,
          model,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message ?? "Failed to save AI settings");
      }

      const data: AiSettingsResponse = await response.json();
      setModel(data.model);
      setHasApiKey(data.hasApiKey);
      setOpenrouterApiKey("");
      setMessage("AI settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-zinc-500">Loading AI settings...</p>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-white">OpenRouter</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Configure the API key and model used for AI price extraction.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block space-y-2 md:col-span-2">
          <span className="text-sm text-zinc-400">OpenRouter API Key</span>
          <input
            type="password"
            value={openrouterApiKey}
            onChange={(event) => setOpenrouterApiKey(event.target.value)}
            placeholder={
              hasApiKey ? "Configured — enter a new key to replace" : "sk-or-..."
            }
            autoComplete="off"
            aria-label="OpenRouter API Key"
            className={fieldClass}
            required={!hasApiKey}
          />
        </label>

        <label className="block space-y-2 md:col-span-2">
          <span className="text-sm text-zinc-400">Model</span>
          <input
            type="text"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="~openai/gpt-mini-latest"
            aria-label="OpenRouter model"
            className={fieldClass}
            required
          />
          <span className="text-xs text-zinc-500">
            OpenRouter model ID, e.g.{" "}
            <span className="text-zinc-400">~openai/gpt-mini-latest</span>
          </span>
        </label>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

      <Button type="submit" disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </form>
  );
};

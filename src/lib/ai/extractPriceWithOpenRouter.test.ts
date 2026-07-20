import { afterEach, describe, expect, it, vi } from "vitest";
import { extractPriceWithOpenRouter, prepareHtmlForPriceExtraction } from "./extractPriceWithOpenRouter";

describe("prepareHtmlForPriceExtraction", () => {
  it("keeps JSON-LD while removing page scripts and styles", () => {
    const result = prepareHtmlForPriceExtraction(`
      <style>.price { color: red; }</style>
      <script type="application/ld+json">{"price":"89.99"}</script>
      <script>window.untrusted = true</script>
      <main>Current price: $89.99</main>
    `);

    expect(result).toContain('{"price":"89.99"}');
    expect(result).toContain("Current price: $89.99");
    expect(result).not.toContain("window.untrusted");
  });
});

describe("extractPriceWithOpenRouter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses the requested OpenRouter model and returns its strict JSON price", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({ price: 129.99, currency: "usd", evidence: "JSON-LD offer" }) } }],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(extractPriceWithOpenRouter({ html: "<main>$129.99</main>", url: "https://shop.test/item" }))
      .resolves.toEqual({ price: 129.99, currency: "USD" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        body: expect.stringContaining('"model":"~openai/gpt-mini-latest"'),
      }),
    );
  });

  it("fails clearly when the OpenRouter key is missing", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    await expect(extractPriceWithOpenRouter({ html: "<main>$10</main>", url: "https://shop.test/item" }))
      .rejects.toThrow("OPENROUTER_API_KEY is not configured");
  });
});

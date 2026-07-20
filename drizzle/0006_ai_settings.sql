CREATE TABLE "ai_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"openrouter_api_key" text,
	"model" text DEFAULT '~openai/gpt-mini-latest' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

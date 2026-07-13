# Stalq Lite

Price monitoring built with Next.js, Neon Postgres, and Context.dev HTML scraping.

## Features

- Add product URLs with per-product scrape settings
- On-demand scraping via Context.dev `GET /v1/web/scrape/html`
- Price extraction from scraped HTML (JSON-LD, meta tags, selectors)
- Price tracker dashboard with movement, sparklines, and change stats
- Global scheduled checks (once or twice daily) via Trigger.dev cron schedules
- Dark Logs page with activity chart and dense scrape log table

## Stack

- Next.js App Router + TypeScript + Tailwind CSS
- Neon Postgres + Drizzle ORM
- Context.dev SDK
- Recharts + Lucide icons
- IBM Plex Sans

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file and fill in credentials:

```bash
cp .env.example .env.local
```

Required variables:

- `DATABASE_URL` — Neon **pooled** connection string (`-pooler` hostname)
- `DATABASE_URL_UNPOOLED` — Neon **direct** connection string (for migrations)
- `CONTEXT_DEV_API_KEY` — from [context.dev](https://context.dev) dashboard
- `TRIGGER_SECRET_KEY` — Trigger.dev API key (dashboard → API keys)
- `TRIGGER_PROJECT_REF` — Trigger.dev project ref (dashboard → Project settings)

3. Apply the database schema:

```bash
npm run db:migrate
```

If `db:push` hangs at "Pulling schema from database...", use `db:migrate` instead — it applies the SQL migration over Neon's HTTP driver (same as the app).

`db:push` uses a websocket connection that can hang in some environments. `db:migrate` is the reliable option for first-time setup.

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scheduled price checks

Global schedule is configured at **Settings** (`/settings`):

- Enable / disable scheduled checks
- Once or twice per day
- Primary and secondary times (HH:mm)
- Timezone (global, not per product)

**How it works:** Saving the schedule creates [Trigger.dev](https://trigger.dev) cron schedules
(one per configured time, timezone-aware and DST-safe) attached to the `scheduled-scrape` task
in `src/trigger/scheduledScrape.ts`. The task runs exactly on schedule — no hourly polling —
with retries and run logs in the Trigger.dev dashboard.

For local testing of batch scrape, use **Run all now** on the Settings page (`POST /api/products/scrape-all`).

### Trigger.dev setup

1. Create a project at [cloud.trigger.dev](https://cloud.trigger.dev) and copy the **project ref**
   into `TRIGGER_PROJECT_REF` (or replace the placeholder in `trigger.config.ts`)
2. Set `TRIGGER_SECRET_KEY` (and `TRIGGER_PROJECT_REF`) in `.env.local` and in Vercel env vars
3. Connect the **Vercel integration** (Trigger.dev dashboard → Project settings → Connect Vercel).
   Every Vercel deploy then auto-deploys the tasks and syncs env vars — no manual `deploy` command
4. Local development: run `npm run trigger:dev` alongside `npm run dev` so scheduled tasks can
   execute locally
5. Re-save the schedule in **Settings** once after setup to create the schedules

The task needs `DATABASE_URL` and `CONTEXT_DEV_API_KEY` available in Trigger.dev (synced
automatically by the Vercel integration).

## Scrape settings

Each product stores Context.dev HTML scrape parameters:

- Main Content Only (`useMainContentOnly`)
- Settle Animations (`settleAnimations`)
- Include / Exclude CSS selectors
- Country (ISO alpha-2 proxy location)
- Wait for (default, 500ms, 1s, 3s, 5s, 30s)
- Timeout toggle with 30s / 1min / 2min options

## API routes

- `GET/POST /api/products`
- `GET/PATCH/DELETE /api/products/[id]`
- `POST /api/products/[id]/scrape`
- `POST /api/products/scrape-all` — scrape all products (manual, from Settings UI)
- `GET/PATCH /api/settings/schedule` — global schedule settings (PATCH syncs Trigger.dev schedules)
- `GET /api/logs?range=&tab=&productId=`
- `GET /api/logs/series?range=&productId=`

## Scripts

- `npm run dev` — development server
- `npm run trigger:dev` — Trigger.dev dev server (runs scheduled tasks locally)
- `npm run build` — production build
- `npm run db:generate` — generate Drizzle migrations
- `npm run db:migrate` — apply SQL migration to Neon (recommended for first setup)
- `npm run db:push` — push schema via drizzle-kit (may hang on websocket)
- `npm run db:studio` — open Drizzle Studio

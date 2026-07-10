# Stalq Lite

Price monitoring built with Next.js, Neon Postgres, and Context.dev HTML scraping.

## Features

- Add product URLs with per-product scrape settings
- On-demand scraping via Context.dev `GET /v1/web/scrape/html`
- Price extraction from scraped HTML (JSON-LD, meta tags, selectors)
- Price tracker dashboard with movement, sparklines, and change stats
- Global scheduled checks (once or twice daily) via Vercel Cron
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
- `CRON_SECRET` — random string for securing `/api/cron/scrape-all`

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

**How it works:** Vercel Cron hits `/api/cron/scrape-all` every hour (`vercel.json`). The route checks whether the current time in your configured timezone matches a schedule slot (±5 min). If yes, it scrapes all products via the existing scrape pipeline.

For local testing of batch scrape, use **Run all now** on the Settings page (`POST /api/products/scrape-all`).

### Vercel deployment

1. Set `CRON_SECRET` in Vercel project environment variables
2. Deploy — `vercel.json` registers the hourly cron job
3. Vercel sends `Authorization: Bearer ${CRON_SECRET}` when invoking cron routes (configure in Vercel dashboard if needed)

External cron services (e.g. cron-job.org) can also call `GET /api/cron/scrape-all` hourly with the same Bearer header.

After pulling this update, run migrations to add `schedule_settings`:

```bash
npm run db:migrate
```

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
- `GET /api/cron/scrape-all` — hourly cron entrypoint (requires `Authorization: Bearer ${CRON_SECRET}`)
- `GET/PATCH /api/settings/schedule` — global schedule settings
- `GET /api/logs?range=&tab=&productId=`
- `GET /api/logs/series?range=&productId=`

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run db:generate` — generate Drizzle migrations
- `npm run db:migrate` — apply SQL migration to Neon (recommended for first setup)
- `npm run db:push` — push schema via drizzle-kit (may hang on websocket)
- `npm run db:studio` — open Drizzle Studio

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

**How it works:** A GitHub Actions workflow (`.github/workflows/cron-scrape.yml`) hits `/api/cron/scrape-all` every hour. The route runs any configured slot whose time has already passed today and has not been scraped yet (catch-up), so delayed Actions still work.

For local testing of batch scrape, use **Run all now** on the Settings page (`POST /api/products/scrape-all`).

### GitHub Actions setup

1. Set `CRON_SECRET` in Vercel project environment variables (same value the app verifies)
2. In the GitHub repo, add Actions secrets:
   - `APP_URL` — production URL, e.g. `https://stalq-lite.vercel.app`
   - `CRON_SECRET` — same value as on Vercel
3. Push the workflow file — scheduled runs start automatically (UTC). Use **Actions → Scheduled scrape → Run workflow** to test manually.

Note: GitHub schedule triggers can be delayed; catch-up logic still runs any due slot later the same day.

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

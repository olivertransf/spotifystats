# Soundfolio

Self-hosted **listening history and stats**: import an **Extended streaming history** ZIP from your Spotify account (privacy export), then **sync new listens from Last.fm** only. Stack: **Next.js**, **Prisma**, **PostgreSQL**.

**Default UI range:** **This year** (`ytd`). Use the period control or `?range=all` for all time.

**Disclaimer:** Not affiliated with Spotify. *Spotify* is a trademark of Spotify AB. The app reads the official **account data export** (ZIP), not the Spotify Web API.

## Demo

A **template preview** at **`/demo`** uses the same UI and stats code as **`/me`**, but reads **synthetic rows in Postgres** (`isDemo: true`) so album and artist images are stored like real data and render reliably.

**One-time after clone / schema change:**

```bash
npm run db:push
npm run db:seed-demo
```

That inserts ~12 months of sample plays (with artwork URLs). Re-run `db:seed-demo` anytime to replace demo data. **Backfill** buttons and `/api/backfill-*` also apply to demo rows missing art.

| Where | URL |
|--------|-----|
| Local dev | `http://localhost:3000/demo` (optional: `?range=ytd` or `?range=1y`) |
| Production | `https://<your-domain>/demo` — e.g. Netlify’s default `https://<site-name>.netlify.app/demo` |

The real stats UI is under **`/me`** (and may require `AUTH_KEY` when set).

### Removing the demo (optional)

After setup or if you only self-host, run:

```bash
npm run remove-demo
```

(`bash scripts/remove-demo.sh` does the same.) It deletes `app/demo/`, `app/api/demo/`, and `lib/demo-*.ts`, restores `/me`-only nav and header, resets the root page, removes the Deezer demo image host from `next.config.ts`, and simplifies `ListeningActivity`. Then run `npm run build` to confirm.

Optionally delete demo rows in SQL: `DELETE FROM "Stream" WHERE "isDemo" = true;` (or keep them; they do not affect `/me` stats).

You can delete `scripts/remove-demo.sh` and the `remove-demo` npm script afterward if you want a minimal tree.

## Screenshots

### Overview

Totals, diversity, and weekly listening (year-to-date).

![Soundfolio overview with stat cards and weekly chart](docs/screenshots/overview.png)

### Listening patterns

Busiest hour and weekday, listening by hour and by day, week × hour heatmap.

![Soundfolio listening patterns page](docs/screenshots/patterns.png)

### Top artists

Ranked by streams for the selected period.

![Soundfolio top artists](docs/screenshots/top-artists.png)

---

## Database (PostgreSQL)

Soundfolio stores every play (`Stream` rows) in Postgres via Prisma. Demo preview rows are the same shape, with **`isDemo: true`** (see [Demo](#demo)).

| What | Why |
|------|-----|
| **`DATABASE_URL`** | Connection string the app and Prisma use at runtime. **Required.** |
| **`DIRECT_URL`** | Some hosts (e.g. Neon) use a separate URL for migrations; if your host docs don’t mention it, you can set it **equal to `DATABASE_URL`** or omit it. |
| **`npm run db:push`** | Applies the schema in `prisma/schema.prisma` to your database (good for first setup and solo projects). |
| **`npm run db:migrate`** | Use when you want versioned migrations (teams / production discipline). |
| **`npm run db:generate`** | Regenerates the Prisma client after schema changes (also runs during `npm run build`). |
| **`npm run db:studio`** | Opens a local GUI to browse tables. |

**Typical cloud Postgres:** enable SSL in the URL (often `?sslmode=require`). Example: `postgresql://USER:PASSWORD@HOST/DB?sslmode=require`.

Never commit `.env`.

---

## Easiest setup (TL;DR)

You need: **Node 20+**, **PostgreSQL**, **Last.fm API key + username**, and the **Spotify privacy ZIP** (not the developer API).

```bash
git clone https://github.com/olivertransf/Soundfolio.git && cd Soundfolio
npm install
cp .env.example .env
```

1. Put your Postgres URL in **`DATABASE_URL`** (and **`DIRECT_URL`** if your host requires it).
2. **`LASTFM_API_KEY`** + **`LASTFM_USER`** — from [Last.fm API](https://www.last.fm/api/account/create), and connect your Spotify app to Last.fm so scrobbles show up.
3. **`npm run db:push`**
4. **`npm run dev`** → **Import** → upload the ZIP → **Sync from Last.fm**.

**Optional:** `AUTH_KEY` locks `/me` routes.

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | **Yes** | PostgreSQL URL. |
| `DIRECT_URL` | Optional | Often same as `DATABASE_URL` for Neon; see host docs. |
| `LASTFM_API_KEY` | **Yes** for live sync | Last.fm API key. |
| `LASTFM_USER` | **Yes** for live sync | Your Last.fm username. |
| `TIMEZONE` | **Recommended** | IANA name (e.g. `America/New_York`) for hour-of-day / day-of-week / daily charts. Many hosts use **UTC**; without this, “busiest hour” follows UTC, not your local time. |
| `AUTH_KEY` | Optional | If set, `/me` requires auth (see below). |

---

## Quick start (detailed)

### 1. Clone and install

```bash
git clone https://github.com/olivertransf/Soundfolio.git
cd Soundfolio
npm install
```

### 2. Configure `.env`

```bash
cp .env.example .env
```

Fill in `DATABASE_URL`, `LASTFM_API_KEY`, and `LASTFM_USER`.

### 3. Create tables

```bash
npm run db:push
npm run db:generate
```

### 4. Run

```bash
npm run dev
```

### 5. Import and sync

1. Request **Extended streaming history** from [Spotify account privacy](https://www.spotify.com/account/privacy/) (delivery can take days).
2. Upload the ZIP in **Import**.
3. Connect Spotify → Last.fm in the Spotify app (Settings → Social) so new plays scrobble.
4. Use **Sync from Last.fm** on Import (the app also triggers a background sync on load).

---

## Backfill: album and artist images

**Does it run automatically?** **Partly.** On each **full browser load** (hard refresh or opening the site in a new tab), `components/sync-on-load.tsx` fires one **batch** each of:

- Last.fm sync (`POST /api/sync-lastfm`)
- Album art backfill (`POST /api/backfill-art`)
- Artist image backfill (`POST /api/backfill-artists`)

**You usually still need to run backfill more than once** if you have many tracks or artists missing images:

| Route | Why |
|-------|-----|
| **In-app limits** | Each API call processes a **fixed batch** (e.g. dozens of album groups / artists per request). A full library is not filled in a single run. |
| **Client navigation** | Clicking around with Next.js `<Link>` does **not** remount the layout, so **SyncOnLoad does not run again** until you **refresh the page** or open the app again. |
| **Manual** | Use **Import → Backfill** buttons anytime; they run the same endpoints as the background job, with loading feedback and response details. |
| **CLI** | `npm run backfill-art` / `backfill-artists` / `backfill-all` run larger batches from your machine (good for finishing a backlog). |

**Summary:** backfill **auto-starts** a little on each full load, but **does not** guarantee a complete fill in one go—repeat refresh, use the Import page buttons, or run the scripts until `remaining` is 0 in the response.

---

## `/me` access (`AUTH_KEY`)

- **Unset:** `/me` is open (fine for trusted local use).
- **Set:** use `?key=` once or the auth page so the cookie is set; mirror the value in production env.

---

## Netlify

1. Connect the repo; build uses `netlify.toml` (`prisma generate` + `next build`).
2. Set env: `DATABASE_URL`, `LASTFM_API_KEY`, `LASTFM_USER`, and optional `DIRECT_URL`, `AUTH_KEY`.

---

## Album and artist images

Backfill uses **no Spotify API**: album art uses iTunes, Last.fm, and Cover Art Archive; artist images use Discogs, Deezer, and Last.fm. See **[Backfill: album and artist images](#backfill-album-and-artist-images)** for automatic vs manual runs and when to run scripts.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 3000). |
| `npm run build` / `start` | Production build / run. |
| `npm run db:push` / `db:migrate` / `db:generate` / `db:studio` | Prisma. |
| `npm run backfill-*` | Art / artists backfill CLI. |
| `npm run db:seed-demo` | Inserts synthetic demo streams into Postgres (`isDemo: true`). |
| `npm run remove-demo` | Deletes bundled `/demo` code and reverts nav/config (optional). |

---

## Troubleshooting

- **Last.fm sync does nothing** — Set `LASTFM_API_KEY` and `LASTFM_USER` in `.env` and restart the dev server. Until then, the API responds with `skipped: true` (not an error) so background refresh requests stay quiet.
- **DB SSL** — Use `?sslmode=require` (or host equivalent) in `DATABASE_URL`.
- **Empty charts** — Import the ZIP and sync Last.fm so rows exist.
- **Wrong “busiest hour” / time-of-day** — Set `TIMEZONE` to your real timezone (IANA). Hosted Node often runs in UTC; hour buckets use `TIMEZONE` (or the server default).

---

## License

[MIT](LICENSE)

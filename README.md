# LiftLog

A personal 4-day training tracker. Pick the day, log weight × reps per set, leave notes, and pull up the history of any exercise — including which machine you used last time and at what load. Built mobile-first for one-handed use at the rack.

Pre-loaded with the **4-Day Upper Focus** program (Pull A / Push A / Pull B / Push B), with the coaching notes baked into each exercise (ramp the heavy compounds, the glute-hyper cue, the French-press/preacher load warnings, etc.).

## Features

- **Per-set logging** — weight and reps for every set, add/remove sets on the fly.
- **Per-exercise notes** — a persistent coaching note shown every session, plus a free per-session note for how it felt or tweaks for next time.
- **Machine variation tracking** — cable/machine exercises vary by gym setup. Each exercise has a free-text "machine / setup" label, and the history view shows past weights grouped with the machine you used, so last week's 10 kg on a different stack doesn't mislead you.
- **Reorder / swap / substitute** — move any exercise up or down, swap it for another (from the program library or a custom name) based on what's free, or add an extra exercise mid-session. Swapping keeps the sets you've already logged.
- **Time tracking** — start time stamps automatically when you begin; a live duration ticks while you train; finish stamps the end. Start/end times and total duration are saved with the session.
- **Backup** — export all data to a JSON file and re-import it (e.g. moving to a new phone). Data > Export / Import in the header.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build    # outputs to dist/
npm run preview  # serve the production build locally
```

## Deploy to Vercel

This is a static Vite + React app — zero config.

1. Push this repo to GitHub.
2. In Vercel: **New Project → import the repo**. Vercel auto-detects Vite (build `npm run build`, output `dist`). Deploy.

It deploys and works immediately in **local-only** mode with no configuration. To turn on cross-device cloud sync, add the Supabase env vars (see *Data & persistence* below) and redeploy.

> **Tip:** open the deployed URL on your phone and "Add to Home Screen" — the meta tags make it launch full-screen like an app.

## Data & persistence

The app runs in one of two modes, decided automatically by whether Supabase env vars are present:

- **Local only** (no env vars) — everything lives in this browser's `localStorage`. Zero setup, works offline, but per-device. Use **Export backup** to move data.
- **Cloud synced** (env vars set) — Supabase is the source of truth, with `localStorage` kept as an offline write-through cache. On load the app reconciles local vs cloud by timestamp (last write wins); every change saves locally instantly and pushes to Supabase on a short debounce. Log at the gym on bad wifi and it syncs when you're back online. The home screen shows a status dot: **cloud synced** / **syncing…** / **local only**.

You don't change any code to switch modes — just set (or don't set) the env vars.

### Enabling cloud sync

1. Create a Supabase project (free tier is plenty).
2. In the Supabase SQL editor, run [`supabase_schema.sql`](supabase_schema.sql) — it creates the `app_state` table and an RLS policy.
3. Copy `.env.example` to `.env` and fill in from **Supabase → Settings → API**:

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   # optional, namespaces your data row:
   VITE_SYNC_ID=stephen-9f3a2b
   ```

4. For Vercel: add the same variables under **Project → Settings → Environment Variables**, then redeploy.

That's it — open the app on any device with the same deploy and it shares one dataset.

> **Security note:** the anon key ships in the client bundle, so with the default permissive RLS policy anyone who has your URL + anon key could read/write the single data row. For a personal tracker that's usually acceptable, especially with a non-guessable `VITE_SYNC_ID`. For real privacy, add Supabase Auth and scope the RLS policy to `auth.uid()`. The schema file spells this out.

All persistence is isolated in [`src/storage.ts`](src/storage.ts) and [`src/supabase.ts`](src/supabase.ts) — the rest of the app is unaware of which mode is active.

## Editing the program

The whole 4-day template lives in [`src/program.ts`](src/program.ts) as plain data — exercise names, target sets/reps, rest, category, and the coaching note. Edit it there to change the template. Existing logged sessions are snapshots and aren't affected.

## Stack

Vite · React · TypeScript · Tailwind CSS. No runtime backend dependency.

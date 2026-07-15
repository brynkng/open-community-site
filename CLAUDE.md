# CLAUDE.md — context & tasks for Claude Code

This file orients Claude Code (or any dev) picking up this project on a local machine.
It was built in a cloud session that **could not reach Cloudflare's API** (network-blocked),
so the only remaining step — deploying — must run here, on this machine.

## What this project is

A **mobile-first community website** for a group that runs multiple **branded programs**:

- **Nomadic Bike Philly** — Sunday bike rides (bikes + coffee, Philly)
- **Saturday Dinner** — free weekly community dinner (has a background-video hero)
- **Community Trips** — one-off trips with an interest list + a "best time" availability poll

Features: RSVPs + live headcounts, a newsletter (Resend), one-click **Instagram publishing**,
an organizer admin, automatic **day-before reminders** and **trip-date-confirmed** emails, and a
**Programs** layer so new branded event series can be added from the admin with no code.

## Commands

```bash
npm run dev               # local dev (OpenNext dev shim; D1 works locally)
npm run typecheck         # tsc --noEmit
npm run build             # OpenNext build (must pass before deploy)
npm run db:migrate:local  # apply migrations/ to local D1
npm run db:migrate:remote # apply migrations/ to remote D1
```

## Codebase knowledge (read before planning features)

Durable, codified context lives in **`docs/solutions/`** — the `ce-learnings-researcher`
agent (used by `/ce-brainstorm` and `/ce-plan`) searches it by frontmatter:

- `data-model-and-database.md` — D1 + Drizzle schema, tables, indexes, migrations
- `programs-layer-architecture.md` — branded event series with no code (`kind` + `programId`)
- `app-architecture-and-integrations.md` — App Router, server actions, auth, IG/Resend/R2/KV/cron
- `coding-conventions.md` — patterns to follow when adding features
- `developer-experience/bulk-sourcing-instagram-photos-to-r2.md` — pulling IG media via the feed API + hosting it in R2 with a committed manifest

## Stack

Next.js 15 (App Router) + React 19 · deployed to **Cloudflare Workers** via
`@opennextjs/cloudflare` · **D1** (SQLite) + Drizzle · **R2** (images + the dinner video) ·
**KV** (Instagram token) · **Resend** (email) · a companion **Cron Worker** in `cron-worker/`.
Admin auth = single password → signed cookie (jose). Everything targets **free tiers**.

## First-time deploy (if not yet deployed)

The owner (Bryan) is on Cloudflare. A turnkey script already exists. Run:

```bash
npm install
export CLOUDFLARE_API_TOKEN="<Bryan's cfat_… token>"   # from the Cloudflare dashboard
export CLOUDFLARE_ACCOUNT_ID="f449c32ba525086556eb4e22486fd89a"
./scripts/deploy.sh
```

`scripts/deploy.sh` (idempotent) creates the D1 database `community_db`, the R2 bucket
`community-media` (+ enables its public dev URL), and the KV namespace `IG_TOKENS`; writes their
IDs into `wrangler.jsonc`; generates `ADMIN_PASSWORD` / `SESSION_SECRET` / `CRON_SECRET`;
applies migrations to remote D1; builds with OpenNext; deploys; and prints the live
`*.workers.dev` URL and admin password.

**Watch for:** the script's auto-capture of the R2 public URL and resource IDs was never tested
against live Cloudflare. If it warns "could not determine …", read the command output, set the
value manually in `wrangler.jsonc` (the placeholders are `REPLACE_WITH_D1_DATABASE_ID`,
`REPLACE_WITH_KV_NAMESPACE_ID`, and the `R2_PUBLIC_BASE_URL` var), and re-run. When migrations
prompt for confirmation, answer `y`.

**Optional for first deploy:** Instagram and email are OFF until their secrets are set — the site
is fully usable without them. Add later:

```bash
npx wrangler secret put RESEND_API_KEY EMAIL_FROM
npx wrangler secret put IG_USER_ID IG_APP_ID IG_APP_SECRET IG_SEED_LONG_LIVED_TOKEN
cd cron-worker && npx wrangler deploy   # reminder + IG-token-refresh jobs
```

After deploy: sign in at `<url>/admin` with the printed password. **Then tell Bryan to roll the
Cloudflare API token** (it passed through a chat during setup).

## Verify before/after

`npm run typecheck` and `npm run build` should both pass (they did when this was handed off).
Migrations `0001`–`0004` apply cleanly in order. Local dev: `npm run db:migrate:local` then
`npm run dev`.

## Instagram note

Publishing is free with **no App Review** because you post to your OWN IG account: convert it to
Business/Creator, link a Facebook Page, make a Meta app in dev mode with that account as admin,
grant `instagram_content_publish`, and seed a long-lived token. Images are served from the R2
public URL; the daily cron refreshes the token. See README for the full walkthrough.

## Conventions (quick reference — full detail in docs/solutions/)

- Mutations are **Next.js Server Actions** (`"use server"`); only cron uses HTTP routes.
- DB: call `getDb()` **per-request**, never a module singleton. Read env via `env()`.
- Schema has **no FK constraints** — relationships are convention-only; dedupe via UNIQUE indexes.
- Migrations are **hand-written, idempotent, wrangler-applied** (drizzle-kit is generate-only).
- Email is **best-effort** — never fail a mutation because a send failed.
- New branded series = **data, not code**: add a `programs` row of the matching `kind`.

## Known follow-ups (not blockers)

- **Dinner desktop video:** mobile uses `public/media/dinner-mobile.mp4` (portrait). Desktop
  reuses it cropped as a stand-in. When a landscape clip is provided, drop it at
  `public/media/dinner-desktop.mp4` and set `DESKTOP_SRC` in `src/components/DinnerBackground.tsx`.
- **Brand naming:** site title is the placeholder "Our Community" — likely should be
  "Sidewalk Story". The Saturday Dinner / Community Trips program colors + taglines are placeholders.
- Auto-post **dinners** to Instagram (rides + trips have buttons; the IG lib is generic).
- Newsletter double opt-in + branded unsubscribe.
- A presentational UI-kit extraction if syncing to claude.ai/design later.

## Map

```
src/app/       home (branded program sections), dinner/, rides/, trips/, admin/, api/cron/
src/db/        Drizzle schema + D1 client        src/lib/  instagram, email, auth, session, cron, programs
src/components/ forms + cards + Program* + DinnerBackground
public/brands/ Nomadic Bike Philly logo   public/icons/ PWA icons   public/media/ dinner video + poster
migrations/    0001–0004 SQL              cron-worker/ companion Cron Worker
scripts/deploy.sh   one-command provision + deploy      README.md  full setup docs
```

---
title: App architecture, auth, and external integrations
type: architecture
area: app
tags:
  [
    next15,
    app-router,
    server-actions,
    auth,
    jose,
    instagram,
    resend,
    r2,
    kv,
    cron,
    cloudflare,
  ]
status: current
created: 2026-07-14
source_files:
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/lib/auth.ts
  - src/lib/session.ts
  - src/lib/instagram.ts
  - src/lib/email.ts
  - src/lib/cron.ts
  - src/app/api/cron/refresh-ig-token/route.ts
  - src/app/api/cron/ride-reminders/route.ts
  - cron-worker/index.js
  - cron-worker/wrangler.jsonc
  - wrangler.jsonc
  - cloudflare-env.d.ts
---

# App architecture & integrations

Next.js 15 App Router + React 19, one Cloudflare Worker built by **OpenNext**
(`@opennextjs/cloudflare`), plus a tiny companion **cron-worker**.

## Bindings (`wrangler.jsonc`, typed in `cloudflare-env.d.ts`)

- `DB` — D1 `community_db` (see [[data-model-and-database]])
- `MEDIA` — R2 `community-media` (cover images + dinner video)
- `IG_TOKENS` — KV (sole use: rotating IG long-lived token)
- `ASSETS` — static assets
- Vars: `NEXT_PUBLIC_SITE_NAME` ("Our Community" placeholder), `R2_PUBLIC_BASE_URL`
- Secrets: `ADMIN_PASSWORD`, `SESSION_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `IG_*` (5), `CRON_SECRET`

## API style — Server Actions first

Almost all mutations are **Next.js Server Actions** (`"use server"`). Only two HTTP routes exist,
both `GET` under `src/app/api/cron/*`, secret-gated. No REST/GraphQL/gRPC surface. Every data page
sets `export const dynamic = "force-dynamic"` (D1 is per-request; no static caching).

**Two server-action shapes:**

1. Form actions returning `{ok, message}` state (typed `FormState`/`AdminState`), consumed by client
   `useActionState` — for user-facing forms.
2. Fire-and-forget actions taking raw `FormData` returning `void` — for admin status toggles, IG
   posts, poll edits.

Both call `revalidatePath()` after writes and `redirect()` where navigation follows.

## Route tree (`src/app/`)

- Public: `page.tsx` (program-section home), `layout.tsx` (nav from active programs + PWA metadata),
  `dinner/`, `rides/` + `rides/[slug]/`, `trips/` + `trips/[slug]/`. Public actions:
  `actions.ts` (`rsvpAction`, `subscribeAction`), `trips/actions.ts` (`tripSignupAction`).
- Admin (all guarded by `requireAdmin()`): `admin/page.tsx` dashboard, `admin/login/`,
  `admin/dinners/new/`, `admin/rides/new/`, `admin/trips/new/`, `admin/trips/[id]/`,
  `admin/programs/`, `admin/newsletter/`, and `admin/actions.ts` (all organizer mutations).
- API: `api/cron/refresh-ig-token/`, `api/cron/ride-reminders/`.

## Auth / session

Single trusted admin, password → signed cookie. **No middleware file** — enforced action-by-action.

- `checkPassword()` (`src/lib/auth.ts`) — compares to `ADMIN_PASSWORD` with a constant-time-ish XOR
  accumulator loop (no early exit).
- Session (`src/lib/session.ts`) — `jose` `SignJWT` `{role:"admin"}`, HS256, signed with
  `SESSION_SECRET`, 7-day expiry, cookie `admin_session` (`httpOnly`, `secure`, `sameSite:"lax"`).
  `isAuthed()` verifies JWT + `role === "admin"`; `destroySession()` deletes it.
- `requireAdmin()` (`auth.ts`) — redirects to `/admin/login` when not authed. **Called at the top of
  every admin page and every admin server action.**
- Flow (`admin/actions.ts`): `loginAction` → `checkPassword` → `createSession` → `redirect("/admin")`.

## External integrations

**Instagram** (`src/lib/instagram.ts`) — Graph API v21.0, posting to the group's **own**
Business/Creator account (Meta app stays in dev mode, no App Review). Token in KV under
`ig_long_lived_token`; `getToken()` seeds from `IG_SEED_LONG_LIVED_TOKEN` on first run;
`refreshToken()` uses `fb_exchange_token` (~60-day extend, daily cron). Two-step publish:
`publishImage()` POSTs `/media` (container → public R2 URL) then `/media_publish`. Callers
(`publishRideToIgAction`, `publishTripToIgAction`) insert a `pending` `igPosts` row, publish, then
update to `published`+`igMediaId` or `failed`+`error`.

**Resend email** (`src/lib/email.ts`) — sent via **raw REST** to `api.resend.com/emails` with
`Bearer RESEND_API_KEY` (the `resend` npm package is present but unused in this path). `sendEmail()`
single-send; `sendNewsletter()` loops recipients → `{sent, failed}`. **All transactional sends are
best-effort: wrapped in try/catch and non-fatal** — RSVP/subscribe/trip-confirm succeed even if
email fails. Senders: `rsvpAction`, `subscribeAction`, `setTripFinalDateAction`,
`sendNewsletterAction`, `ride-reminders` cron.

**R2** (`MEDIA`) — object-key conventions: `rides/<slug>.<ext>`, `trips/<slug>.<ext>`,
`brands/<slug>-<rand>.<ext>`. 8 MB upload cap in actions. Public reads via `R2_PUBLIC_BASE_URL`;
`next.config.ts` allow-lists `**.r2.dev` and `**.cloudflarestorage.com`.

**Cron** — the OpenNext Worker cannot expose `scheduled()`, so `cron-worker/` drives it. Its
`wrangler.jsonc` defines two triggers (`10 8 * * *`, `15 8 * * *` UTC); `index.js`'s `scheduled()`
fetches both `/api/cron/refresh-ig-token` and `/api/cron/ride-reminders` (idempotent) with
`?key=CRON_SECRET`. App-side `authorizeCron(req)` (`src/lib/cron.ts`) checks `?key=` or
`Authorization: Bearer` against `CRON_SECRET`. `ride-reminders` emails tomorrow's published-event
RSVPs where `reminderSentAt IS NULL`, then stamps it (skip-on-error = retried next run).

See [[coding-conventions]] and [[programs-layer-architecture]].

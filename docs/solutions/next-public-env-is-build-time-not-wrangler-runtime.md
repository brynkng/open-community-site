---
title: NEXT_PUBLIC_* vars are build-time — wrangler.jsonc vars won't reach the client
type: bug
area: cloudflare-nextjs
tags:
  [next15, opennext, cloudflare, wrangler, env, turnstile, client-components]
status: current
created: 2026-07-15
source_files:
  - .env.production
  - wrangler.jsonc
  - src/components/TurnstileWidget.tsx
  - src/lib/env.ts
---

# NEXT_PUBLIC_* is build-time, not a Cloudflare runtime binding

## The trap

`wrangler.jsonc` `vars` are **runtime bindings** — available server-side via
`getCloudflareContext().env` (our `env()` helper). They are **not** present in `process.env`
when `next build` runs.

Next.js inlines `process.env.NEXT_PUBLIC_*` into the **client bundle at build time**. If the value
isn't in the build environment, Next bakes in `undefined` — even though the same name is defined as
a `wrangler.jsonc` var and shows up in the deploy's binding list.

## How it bit us (twice)

`src/components/TurnstileWidget.tsx` (a client component) reads
`process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY` and early-returns if it's falsy. The site key lived
**only** in `wrangler.jsonc` `vars`, so the client chunk was built with `undefined`, the widget
never loaded `challenges.cloudflare.com/turnstile/v0/api.js`, no token was produced, and **every
Turnstile-gated write was rejected server-side** (`verifyTurnstile` has no fail-open). This silently
broke the phase-4 RSVP widget (stuck on "Verifying you're human…") and all phase 5–8 community
writes — while the server-side `env().TURNSTILE_SECRET_KEY` (a real Worker secret) worked fine,
masking the client-side gap.

The symptom was subtle: SSR _could_ render the key (it reads the runtime var), so grepping the
served HTML sometimes found it — but the **client JS chunk** never contained it. The definitive
check was `curl`-ing the referenced `_next/static/chunks/*.js` and grepping for the key.

## The rule

- **Server-side** config (secrets, runtime vars) → `wrangler.jsonc` vars / Worker secrets, read via
  `env()`. Works at runtime.
- **Client-side** config (`process.env.NEXT_PUBLIC_*` in a `"use client"` component) → must be in the
  **build environment**. Put public values in a committed **`.env.production`** (Next reads it during
  `next build`; `opennextjs-cloudflare build` runs `next build`). For local dev, use `.env.local`.
- A `NEXT_PUBLIC_*` value that is genuinely secret should not be `NEXT_PUBLIC` at all — it ends up in
  the client bundle. (Turnstile site keys are public, so committing is fine; the paired
  `TURNSTILE_SECRET_KEY` stays a Worker secret.)

## Gotchas when verifying a fix

- **Chunk hashes + edge cache.** Changing an inlined value changes the client chunk's content hash.
  After deploy, an already-open browser tab (or stale edge HTML) may still reference the old chunk —
  hard-reload / cache-bust the URL to pick up the new bundle. Verify by curling the chunk the _prod
  HTML currently references_ and grepping for the value.
- Confirm the client actually loads `challenges.cloudflare.com/...` in the network panel — a missing
  request means the widget never mounted (usually the undefined-key early-return).

## Alternative (avoids build-time env entirely)

Pass the site key as a **prop from a Server Component** (which reads `env()` at runtime) down to the
client `TurnstileWidget`, instead of reading `process.env` in the client. More robust across
environments, but requires threading the prop through each write form. We chose `.env.production`
as the minimal fix since the key is public.

See [[app-architecture-and-integrations]] and [[coding-conventions]].

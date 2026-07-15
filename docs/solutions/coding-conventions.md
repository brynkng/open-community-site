---
title: Coding conventions & patterns to follow
type: convention
area: all
tags:
  [conventions, patterns, drizzle, server-actions, slugs, uploads, migrations]
status: current
created: 2026-07-14
source_files:
  - src/lib/env.ts
  - src/lib/utils.ts
  - src/db/index.ts
  - src/app/admin/actions.ts
---

# Coding conventions & patterns

Follow these when adding features so new code matches the codebase.

- **Path alias**: import via `@/...` (`@/db`, `@/lib/...`, `@/components/...`) — never relative deep
  paths. (`tsconfig.json` maps `@/*` → `src/*`.)
- **DB access**: always `getDb()` inside the request; **never a module-level client**. Read env only
  through `env()` (`src/lib/env.ts`). See [[data-model-and-database]].
- **Schema style**: integer autoincrement PK; `createdAt` epoch-integer default `(unixepoch())`;
  `mode:"timestamp"`/`mode:"boolean"` for Drizzle mapping; TEXT enums for status/kind; explicit named
  indexes in the table's third arg. **Relationships are convention-only (no FK constraints)** —
  enforce integrity in app code and via UNIQUE indexes.
- **Migrations**: hand-written, additive, idempotent SQL in `migrations/NNNN_name.sql`, applied by
  wrangler (drizzle-kit is generate-only and bypassed). Keep new migrations in this style/numbering.
  Seed with fixed ids only when later code depends on them (as `0004` does).
- **Polymorphic associations** use `(kind, refId)` with a UNIQUE index for dedupe (`rsvps`,
  `igPosts`). Follow this for new cross-event tables.
- **Server actions — two return shapes**: `{ok, message}` state objects for user-facing forms (typed
  `FormState`/`AdminState`, driven by client `useActionState`); and `void` `FormData` handlers for
  admin toggles. **Start every admin action with `await requireAdmin()`.** Follow writes with
  `revalidatePath()` for each affected route. See [[app-architecture-and-integrations]].
- **Slugs**: `slugify(title)` + `randomToken(n)` suffix for uniqueness (`rides`/`trips` use 3 bytes,
  `programs` 2). Helpers in `src/lib/utils.ts` (`slugify`, `randomToken` via
  `crypto.getRandomValues`, `formatDate`, `isValidEmail`).
- **Uploads**: 8 MB cap, ext inferred from MIME, keyed by feature prefix, stored in `MEDIA`, served
  from `R2_PUBLIC_BASE_URL`.
- **Email is best-effort**: wrap sends in try/catch; **never fail a mutation because email failed.**
- **New branded series = data, not code**: add a `programs` row of the matching `kind`; rendering,
  RSVP, poll, and cron behavior is inherited via `kind` + `programId`. Only a genuinely new `kind`
  requires code. See [[programs-layer-architecture]].
- **Validation**: hand-rolled in actions (zod is a declared dep but not yet used in the read paths).
- **Data pages** set `export const dynamic = "force-dynamic"` (D1 is per-request; no static caching).

## Known placeholders / follow-ups (not blockers)

- `NEXT_PUBLIC_SITE_NAME` = "Our Community" — likely should be "Sidewalk Story".
- Seeded program colors/taglines (migration `0004`) are placeholders.
- Desktop dinner video reuses the mobile portrait clip (`DinnerBackground.tsx`) until a landscape
  clip is dropped at `public/media/dinner-desktop.mp4`.
- `subscribers.confirmed` defaults false but `subscribeAction` inserts `true` (double opt-in
  scaffolded, not enforced).

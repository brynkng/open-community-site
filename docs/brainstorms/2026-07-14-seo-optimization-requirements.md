# SEO Optimization — Requirements

**Date:** 2026-07-14
**Status:** Ready for planning
**Scope:** Standard (spans routing + metadata + one small data addition)

## Problem & Goal

Sidewalk Story is server-rendered and crawlable, but its SEO surface is nearly bare: a single root
`metadata` block (title/description/icons) inherited by every page, no OpenGraph/Twitter cards, no
structured data, no sitemap, no robots file, no canonical URLs. Two outcomes are wanted, weighted
**roughly equally**:

1. **Search discovery** — a stranger in Philly searching "free community dinner" or "Sunday bike
   ride Philly" can find the site and land on the right page.
2. **Shareability** — when a member drops a link into Instagram, iMessage, WhatsApp, or a group
   chat, it renders a rich preview card instead of a bare URL.

Both goals are served by the same underlying work (metadata, structured data, social cards, crawler
plumbing), so this is treated as one sweep rather than two tracks.

## Current State (verified against the codebase)

- `src/app/layout.tsx` — root `metadata`: title "Sidewalk Story", one generic description, icons,
  manifest, theme color. **No `metadataBase`.**
- **No per-page metadata** anywhere — `/dinner`, `/rides`, `/trips`, and the `[slug]` detail pages
  all inherit the root title/description.
- **No OpenGraph or Twitter card tags.**
- **No `sitemap.ts` / `robots.ts`.**
- **No JSON-LD structured data.**
- **No canonical URLs.** Program pages are filtered via `?program=<slug>` query params
  (`/dinner?program=…`, `/rides?program=…`, `/trips?program=…`), which need canonicalization.
- Public routes today: `/`, `/dinner` (renders only the _next_ dinner — no per-dinner permalink),
  `/rides` + `/rides/[slug]`, `/trips` + `/trips/[slug]`. All `force-dynamic`.
- **No `NEXT_PUBLIC_SITE_URL`** — `wrangler.jsonc` has `NEXT_PUBLIC_SITE_NAME` and
  `R2_PUBLIC_BASE_URL` but no canonical origin. (See Dependencies.)
- Schema: `programs` has `logoUrl` + `accentColor` but **no dedicated OG/hero image field**;
  `rides` has `imageKey` (R2 cover); `dinners` has `date`/`title`/`location`/`startTime`/
  `description` but **no `slug`**.

## In Scope

### 1. Per-page metadata

Add `generateMetadata` to every public route so each page has a unique, descriptive title and
description:

- Home — org-level positioning ("Saturday dinners, Sunday rides, community trips in Philadelphia").
- `/dinner`, `/rides`, `/trips` index pages — program-aware titles (reflect `?program=` when set).
- `/rides/[slug]`, `/trips/[slug]`, and new `/dinner/[slug]` — event-specific title + description
  drawn from the event's own fields (title, date, location).

### 2. Social preview cards (OpenGraph + Twitter)

- OG + Twitter `summary_large_image` tags on every page.
- **Per-program static images**: one branded image per program kind (dinner / rides / trips),
  reused across all events of that kind, with a **site-wide default** fallback for the home page and
  any program without its own image. No runtime image generation.
- Image source: to be resolved in planning — either add an `ogImageUrl` field to `programs` (fits
  the "new series = data, not code" philosophy) or map program `kind` → a static asset in
  `public/`. Existing `public/photos/` and `public/brands/` are candidate sources.

### 3. Structured data (JSON-LD)

- **`Event`** schema on each event detail page (dinner, ride, trip) — the highest-value item, since
  it powers Google's event rich results. Populate `name`, `startDate`, `location`, `description`,
  `eventStatus`, `organizer`, and `offers`/`isAccessibleForFree` (dinners are free) from existing
  fields.
- **`Organization`** + **`WebSite`** schema on the home page.

### 4. Crawler plumbing

- `sitemap.ts` (App Router convention) — lists static routes plus **all published events**
  (dinners, rides, trips) dynamically from D1, with `lastModified`.
- `robots.ts` — allow crawling, disallow `/admin` and `/api`, reference the sitemap.
- **Canonical URLs** on all pages. Decide `?program=` handling: canonical should point to the clean
  program URL (the query-param page canonicalizes to itself or to the un-parameterized page — settle
  in planning).

### 5. New `/dinner/[slug]` route

Give each Saturday dinner its own shareable, indexable permalink, matching rides/trips.

- **Slug format: `<date>-<short-program-slug>`** (e.g. `/dinner/2026-07-19-saturday-dinner`) —
  unique by construction (date + program), human-readable, and needs **no schema migration** (both
  fields already exist). The existing `/dinner` page continues to show the next dinner and links to
  its permalink.

## Out of Scope (this pass)

- **Auto-generated per-event OG images** (title/date/headcount baked into the image). Considered and
  declined in favor of per-program static images — lower carrying cost for a volunteer-run site.
- **Adding a `slug` column to `dinners`** — the date+program composite slug avoids it.
- Analytics / Search Console setup, backlink strategy, content marketing, blog.
- Newsletter double opt-in and other unrelated follow-ups from `CLAUDE.md`.

## Dependencies & Assumptions

- **Canonical origin is required and does not exist yet.** `metadataBase`, canonical URLs, absolute
  OG image URLs, and sitemap entries all need an absolute origin. Planning must add a
  `NEXT_PUBLIC_SITE_URL` (or equivalent) env var. **Assumption:** a real custom domain is intended —
  a `*.workers.dev` origin works technically but is weak for the "search discovery" goal; confirm
  the domain before shipping so canonical URLs are stable (changing the canonical origin later
  resets indexing).
- All event detail pages are `force-dynamic`; that is fine for crawlers (fully server-rendered
  HTML), so no static-generation change is required for correctness. Any move to caching/ISR is a
  separate optimization, not part of this.
- Structured data assumes existing event fields are populated by organizers; missing optional
  fields (e.g. a dinner with no `location`) must degrade gracefully rather than emit invalid JSON-LD.

## Success Criteria

- Every public page returns a unique `<title>`, meta description, canonical URL, and OG + Twitter
  card tags (verifiable by view-source and a card-preview/validator tool).
- A shared link to a dinner, ride, or trip renders a rich preview card with the per-program image.
- Event detail pages emit valid `Event` JSON-LD that passes Google's Rich Results Test.
- `/sitemap.xml` lists all published events and `/robots.txt` resolves, disallowing `/admin` +
  `/api` and referencing the sitemap.
- Each dinner is reachable at a stable `/dinner/<date>-<program>` permalink.
- `npm run typecheck` and `npm run build` pass.

## Open Questions for Planning

- OG image source: new `programs.ogImageUrl` field vs. static `kind`→asset mapping.
- `?program=` canonical target: self-canonical vs. collapse to un-parameterized page.
- Exact short-program-slug used in the dinner permalink (reuse `programs.slug` directly vs. a
  shortened form).

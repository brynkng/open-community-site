# docs/solutions — codified project knowledge

Durable learning docs that ground future `/ce-brainstorm` and `/ce-plan` work. The
`ce-learnings-researcher` agent searches this directory by frontmatter before planning.

- [Data model & database](./data-model-and-database.md) — D1 + Drizzle schema, tables, indexes, migrations.
- [Programs layer](./programs-layer-architecture.md) — branded event series with no code (`kind` + `programId`).
- [Recurring event series](./recurring-event-series-materializer.md) — weekly template + idempotent daily cron materializer (one row per dated instance so RSVP/reminder/IG code is untouched); one-offs are `series_id` NULL.
- [App architecture & integrations](./app-architecture-and-integrations.md) — App Router, server actions, auth, Instagram/Resend/R2/KV/cron.
- [Coding conventions](./coding-conventions.md) — patterns to follow when adding features.
- [Design prototype porting](./design-prototype-porting.md) — porting Claude Design (claude.ai/design) updates into the live app: handoff-snapshot diffing, `--ss-*`→`--brand-*` token mapping, inline-styles vs media queries.
- [Video-background poster must be CSS-driven](./video-background-poster-must-be-css-driven.md) — a video hero's poster fallback must be an always-rendered CSS media-query element, not a JS-gated `<img>` or `<video poster>`, or the hero goes black before hydration (the `/dinner` black-hero bug).
- [Hiding a link's only child at a breakpoint kills its tap target](./hiding-a-links-only-child-at-a-breakpoint-kills-its-tap-target.md) — `display:none` on a link/button's only child collapses it to zero tappable area; always keep a visible fallback (icon) inside the link (the mobile home-link bug).
- [router.prefetch() warms dynamic routes; <Link> prefetch doesn't](./router-prefetch-warms-dynamic-routes-link-prefetch-doesnt.md) — default in-viewport `<Link>` prefetch only warms the loading boundary for `force-dynamic` routes; call `router.prefetch()` to warm the full RSC payload (idle-time route prefetcher). Prefetch is production-only — it doesn't fire in `next dev`.
- [OG image must physically be 1200×630](./og-image-must-match-declared-1200x630.md) — `pageMetadata()` declaring `width:1200,height:630` doesn't resize the file; social cards center-crop. Build the default OG asset at the real ratio by padding the logo onto more of its own sampled background color (ImageMagick `-extent`), not by pointing metadata at a raw square logo.
- [Bulk-sourcing IG photos to R2](./developer-experience/bulk-sourcing-instagram-photos-to-r2.md) — pulling a community's own Instagram media via the private feed API, Chrome/CDP download gotchas, and R2 hosting with a committed manifest.

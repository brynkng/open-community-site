# docs/solutions — codified project knowledge

Durable learning docs that ground future `/ce-brainstorm` and `/ce-plan` work. The
`ce-learnings-researcher` agent searches this directory by frontmatter before planning.

- [Data model & database](./data-model-and-database.md) — D1 + Drizzle schema, tables, indexes, migrations.
- [Programs layer](./programs-layer-architecture.md) — branded event series with no code (`kind` + `programId`).
- [App architecture & integrations](./app-architecture-and-integrations.md) — App Router, server actions, auth, Instagram/Resend/R2/KV/cron.
- [Coding conventions](./coding-conventions.md) — patterns to follow when adding features.
- [Design prototype porting](./design-prototype-porting.md) — porting Claude Design (claude.ai/design) updates into the live app: handoff-snapshot diffing, `--ss-*`→`--brand-*` token mapping, inline-styles vs media queries.
- [Bulk-sourcing IG photos to R2](./developer-experience/bulk-sourcing-instagram-photos-to-r2.md) — pulling a community's own Instagram media via the private feed API, Chrome/CDP download gotchas, and R2 hosting with a committed manifest.

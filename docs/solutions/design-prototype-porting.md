---
title: Porting the Claude Design prototype into the live app
type: convention
area: frontend
tags:
  [
    design,
    prototype,
    claude-design,
    css-tokens,
    data-brand,
    responsive,
    porting,
    dinner-panel,
  ]
status: current
created: 2026-07-15
source_files:
  - src/components/DinnerPanel.tsx
  - src/app/page.tsx
  - src/app/globals.css
---

# Porting the Claude Design prototype into the live app

The visual design lives in a **Claude Design project** (claude.ai/design) as a set of
top-level prototype files (`landing.jsx`, `styles.css`, `shared.jsx`, `dinners.jsx`,
`bikes.jsx`, `trips.jsx`, `app.jsx`). The live app is a separate re-implementation, so
"apply the design update" means porting deltas by hand, not copying files. These are the
gotchas that make that port fast and correct. First applied in commit `de28fce` (the
dinner panel's `split-band` layout).

## Find "what changed" by diffing against the handoff snapshot

The Design project contains **both** the current top-level prototype files **and** a
`design_handoff_community_site/design/` subfolder — a frozen SNAPSHOT of the prototype as
of the last implementation. To find exactly what the designer changed since you last
ported, **diff each top-level file against its `design_handoff_*` counterpart**. Files
that are byte-identical didn't change. In `de28fce` this isolated a **single** edit (the
dinner panel in `landing.jsx`); everything else was untouched. This beats re-porting every
file and re-eyeballing for diffs.

After a successful port, treat the handoff snapshot as stale — the next port should diff
against whatever snapshot reflects _this_ implementation.

## Token scope mismatch: `--ss-*` (global) → `--brand-*` (scoped)

The prototype uses **global** CSS custom properties: `--ss-bg`, `--ss-red-deep`,
`--nb-navy`, etc. The live app (`src/app/globals.css`) instead defines
**`[data-brand="ss|nb|ft"]`-scoped** vars with generic names:
`--brand-bg`, `--brand-bg-deep`, `--brand-accent`, `--brand-accent-deep`, `--brand-ink`,
`--brand-font`. Porting any prototype style requires **mapping `--ss-*` → `--brand-*`**
(e.g. `--ss-bg` → `--brand-bg`, `--ss-red-deep` → `--brand-accent-deep`).

**Cross-brand tokens don't resolve under a component's own `[data-brand]` scope.** The
dinner panel is rendered inside `data-brand="ss"`, but its gradient ends on the Nomadic
Bike navy (`--nb-navy`). Under `[data-brand="ss"]` there is no `--nb-navy` (and no
`--brand-*` alias for it), so referencing it yields a transparent/unstyled stop. **Fix:
hardcode the hex** — the gradient's final stop is literally `#1F3A63`
(`DinnerPanel.tsx`, the inline `linear-gradient(...)`). Rule: when a scoped component
references _another_ brand's color, hardcode its hex or the value silently drops out.

## The live component may have diverged from the prototype's default variant

The prototype's `landing.jsx` defaulted `dinnerLayout` to `split-band`, but the live
`DinnerPanel.tsx` had been implemented as a **different** variant (`lower-band`). So
"apply the design update" actually meant **switching layouts**, not editing matching code.
Before assuming a design edit maps 1:1 onto the live component, **check which prototype
variant the live code actually implements** — the delta may be structural.

## Inline styles can't hold media queries — hoist breakpoint values to classes

The prototype's split-band copy column is `max-width: min(440px, 44%)`, which collapses to
~170px on a 390px phone. Breakpoint-dependent values **cannot** live in a React inline
`style={}` object. The fix was to move the three breakpoint-sensitive properties (video
`transform`, scrim gradient, copy `max-width`) out of inline styles into three CSS classes
in `globals.css` — `.ds-dinner-video`, `.ds-dinner-scrim`, `.ds-dinner-copy` — with a
`@media (max-width: 639px)` block that gives mobile full-width copy, an un-nudged video,
and a bottom-weighted scrim (a cleaner "lower-band" feel). General rule: any value that
must change at a breakpoint belongs in a class, not inline.

## Verifying mobile: use Playwright, not claude-in-chrome resize

For visual checks, render desktop (1280px) and mobile (390px). In this environment
**Playwright's `browser_resize` gives a true mobile viewport**, but **claude-in-chrome's
`resize_window` did NOT** — the page kept rendering at desktop width. Use
`page.setViewportSize` / Playwright `browser_resize` for mobile verification here.

## Checklist for the next design port

1. Diff top-level prototype files against `design_handoff_*` to find changed files.
2. For each change, check which variant the live component implements (it may have diverged).
3. Map `--ss-*` → `--brand-*`; hardcode any cross-brand token's hex.
4. Move breakpoint-dependent values into classes with a `@media` block, not inline styles.
5. `npm run typecheck`, then verify desktop and mobile (Playwright for mobile).

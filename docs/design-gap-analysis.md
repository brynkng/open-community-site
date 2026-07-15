# Design → Code Gap Analysis

**Source of truth:** the Claude Design project _"Sidwalk Story / South Philly Community"_
(`index.html` + `landing/dinners/bikes/trips/shared.jsx`, `data.js`, `styles.css`).
**Target:** the live Next.js 15 app in this repo.
**Rule for this doc:** the design defines the _required_ feature set. Anything the design needs
that the app lacks is a **gap to build**. Anything the app has that the design omits is flagged as
**divergence** (keep as infrastructure, or drop) — not a requirement.

Generated 2026-07-14. Feeds `/ce-plan`. See [[app-architecture-and-integrations]],
[[data-model-and-database]], [[programs-layer-architecture]].

---

## 0. The headline gap — write model

|                      | Design (required)                                                                             | App (today)                                            |
| -------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Who can post content | **Anyone, no account** — RSVPs, photos, board posts, comments are all anonymous public writes | Only the **admin** (password → cookie) creates content |
| RSVP identity        | Optional name, **no email**; or a one-tap anonymous 👍                                        | **Name + email required**, unique per email            |
| Photos               | Any visitor uploads to a shared album                                                         | No photo feature at all                                |
| Discussion           | Public board + per-trip comments                                                              | None (newsletter is the only public loop)              |

**Implication:** the design turns the site into a lightweight community social space. That means
new **public, unauthenticated write endpoints** (server actions) plus **abuse/moderation** concerns
the current admin-only model never had (spam posts, unmoderated image uploads to a public R2 bucket,
vote manipulation). This is the central decision the rebuild hinges on — see §6.

---

## 1. Required features from the design (inventory)

### Brand & information architecture

- **Three named sub-brands**, each with its own font, color palette, logo, and voice:
  - _Sidewalk Story_ — dinners — Alfa Slab One, brick red `#A8332A`
  - _Nomad Bike Philly_ — rides — Archivo (condensed/heavy), navy `#1F3A63`
  - _Field Trip Philly_ — trips — Bricolage Grotesque, forest green `#2E5339`
- **Landing** = three full-bleed brand panels (hero header + panels + footer), dinner panel is
  **video-forward** with drifting photo tiles; optional photo **marquee**.
- **Brand-aware top nav** (logo swaps per section, active-link state) + **section footer**.
- **Copy variants** ("warm" vs "direct") for headlines — a design exploration, not a hard req.

### Per-section pages (dinners / rides / trips)

- **Hero**: brand logo, headline, intro, feature **chips**, and a "next event" card computed from
  the calendar (`nextSaturday()` / `nextSunday()`).
- **"How it works"** 3-card strip (dinners) / **route strip** with stops (rides).
- **RSVP widget**: one-tap anonymous 👍 _or_ name + party-size; live "N in so far"; recent names.
- **Shared photo album**: multiple albums per section, one "main", **date-grouped**, drag/drop
  **upload with no account**, create-new-album inline.
- **Community board**: posts (title/body/optional name), **up/down votes**, threaded **comments**,
  inline composer.

### Trips

- **Trip cards** with status **`open` | `planning`**, "N going", expandable panel containing the
  RSVP widget + a per-trip **"Trip talk"** comment thread.
- "Got a trip idea?" prompt → pitch on the board.

### Cross-cutting

- Font stack (4 Google fonts), three-palette **design-token system**, motion (scroll-reveal, drift,
  float, marquee, pop) with `prefers-reduced-motion` support, photo-tile treatment (gradient
  placeholders + grain), rounded card system.

### Explicitly NOT a requirement

- **Tweaks panel** (`tweaks-panel.jsx`, `app.jsx`) — a live design-exploration tool. Exclude.
- `localStorage` persistence (`data.js` `SPC`) — prototype stand-in for a real backend.
- Hash router — replaced by Next.js App Router.

---

## 2. Feature-by-feature diff

Legend: ✅ exists · 🟡 partial · ❌ missing · ⬇️ app-only (divergence)

| Feature (design = required)                            | Today   | Gap / work needed                                                                                                                                                                                        |
| ------------------------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Three branded series w/ per-brand font+color+logo      | 🟡      | Programs layer exists but is single-accent, generic; names are placeholders ("Our Community"). Need per-brand **typography** + palettes + real names/logos. Can drive off the existing `programs` table. |
| Landing: full-bleed brand panels                       | ❌      | Today is card sections + newsletter. Rebuild `page.tsx`.                                                                                                                                                 |
| Landing: dinner video hero + drifting photos + marquee | 🟡      | `DinnerBackground` exists (video); no drift/marquee/photo composition.                                                                                                                                   |
| Brand-aware nav + footer                               | 🟡      | Nav exists from programs; not brand-styled. No footer.                                                                                                                                                   |
| Section hero + chips + computed "next event" card      | 🟡      | Dinner page has hero+headcount; rides/trips much simpler; no chips, no "how it works".                                                                                                                   |
| "How it works" / route strip                           | ❌      | New presentational sections.                                                                                                                                                                             |
| RSVP: anonymous one-tap 👍                             | ❌      | RSVP **requires name+email**. Need anonymous quick-yes counter.                                                                                                                                          |
| RSVP: name + party size, **no email**                  | 🟡      | Exists but email is **required + unique**. Must relax.                                                                                                                                                   |
| RSVP: live headcount + recent names                    | ✅ / 🟡 | Headcount ✅ (dinner/rides). "Recent names" list ❌.                                                                                                                                                     |
| **Shared photo albums** (multi-album, date-grouped)    | ❌      | No album/photo tables. New data model + pages.                                                                                                                                                           |
| **Photo upload, no account**                           | ❌      | No public upload path. Need R2 upload via public server action (+ moderation).                                                                                                                           |
| **Community board** (posts/votes/comments)             | ❌      | Entirely new: tables, public server actions, UI.                                                                                                                                                         |
| **Per-trip comments** ("Trip talk")                    | ❌      | New `trip_comments` table + public action.                                                                                                                                                               |
| Trip status `open`/`planning` + "N going"              | 🟡      | Trips exist with a **date poll** instead; status enum differs (`published/draft/cancelled`). Reconcile.                                                                                                  |
| Fonts (Alfa Slab One, Archivo, Bricolage, Karla)       | ❌      | Add to `layout.tsx` / CSS.                                                                                                                                                                               |
| Three-palette token system                             | 🟡      | Single paper/ink theme + per-program `accentColor`. Expand to 3 palettes.                                                                                                                                |
| Motion (reveal/drift/float/marquee/pop)                | ❌      | Add CSS + a `Reveal` (IntersectionObserver) client component.                                                                                                                                            |

### App-only — divergence (design omits; decide keep vs drop)

| App feature                                            | Recommendation                                                                                                                                                        |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ⬇️ Newsletter / subscribers (Resend)                   | **Keep** as infra — design just doesn't surface it. Optional footer signup.                                                                                           |
| ⬇️ Instagram publishing (admin)                        | **Keep** — backend-only, orthogonal to the redesign.                                                                                                                  |
| ⬇️ Admin panel (auth, create events/programs)          | **Keep + essential** — the design's content still needs to be created/managed by someone. Design's "no account" applies to _community_ content, not event scheduling. |
| ⬇️ Trip date-poll (options + availability votes)       | **Decide.** Design replaced it with `open/planning` status + comments. Either drop the poll or keep it behind `planning` status.                                      |
| ⬇️ Day-before reminders + trip-confirmed emails (cron) | **Keep** — valuable, invisible to the redesign.                                                                                                                       |

---

## 3. Data-model gaps

New tables required by the design (follow [[coding-conventions]]: epoch-int `createdAt`, TEXT enums,
named indexes, no FK constraints, UNIQUE for dedupe):

- **`albums`** — `id`, `programId` (or `section` enum), `name`, `main` bool, `sortOrder`, `createdAt`.
- **`album_photos`** — `id`, `albumId`, `takenDate` (ISO), `imageKey` (R2), `caption`, `createdAt`.
- **`board_posts`** — `id`, `programId`/`section`, `title`, `body`, `authorName`, `voteScore` int, `createdAt`.
- **`board_comments`** — `id`, `postId`, `authorName`, `text`, `createdAt`.
- **`board_votes`** — `id`, `postId`, `voterKey` (cookie/hash), `dir` (±1); UNIQUE `(postId, voterKey)` to stop double-votes. _(Prototype tracks votes only in local state — a real backend needs this.)_
- **`trip_comments`** — `id`, `tripId`, `authorName`, `text`, `createdAt`.

Schema **changes** to existing tables:

- **`rsvps`**: make `email` **nullable**; drop/relax the `UNIQUE(kind, refId, email)` constraint
  (anonymous RSVPs have no email); add an anonymous **quick-yes** path — either a `quick` bool or a
  per-event counter table. Reconcile "recent names" display.
- **`trips`**: reconcile `status` — design wants `open`/`planning`; today it's
  `published`/`draft`/`cancelled` + a poll. Pick one status vocabulary.

Migrations: add as `migrations/0005_*.sql` … onward, hand-written & idempotent (drizzle-kit is
generate-only here).

---

## 4. Visual / design-system gaps

- **Typography**: 4 Google fonts, per-brand assignment (`--font-ss/nb/ft/body`). Today: Tailwind
  defaults. Load via `next/font` or `<link>` in `layout.tsx`.
- **Color**: promote the 3 brand palettes into tokens (currently one `accentColor` per program).
  The design uses `oklch(from …)` for derived deep shades — keep or precompute.
- **Components to port**: `Photo` (gradient placeholder + grain), `Reveal`, `RsvpWidget`, `Board`
  - `Post`, `AlbumSection`, `TopNav`, `SectionFooter`, `TripCard`, `TripComments`, landing panels.
    These are prototype React (CDN) → convert to typed Next.js client/server components, swapping
    `SPC.*` local-storage calls for server actions.
- **Motion**: CSS keyframes (`drift`, `floaty`, `marq`, `pop`, `.rv` reveal) + an IntersectionObserver
  client hook. All already gated behind `prefers-reduced-motion` in the design — preserve that.

---

## 5. Assets to import from the design project

Binary assets referenced by the design (pull via the design MCP into `public/`):

- Logos: `assets/sidewalk-story.png`, `assets/nomadic-bike.jpg`
- Videos: `assets/dinner-bg.mp4` (desktop/landscape — **fills the current known follow-up gap**),
  `assets/dinner-bg-mobile.mp4`
- Photos: `assets/photos/{dinner-couch,dinner-group,dinner-selfie,ride-coffee,ride-fallen-tree,ride-staging,ride-uprooted}.jpg`
- (The `data.js` gradient placeholders `P(brand,hue,cap)` are stand-ins — real photos replace them.)

Note: the design's landscape `dinner-bg.mp4` directly resolves the existing
"desktop dinner video reuses the mobile clip" follow-up.

---

## 6. Key decisions — RESOLVED (2026-07-14)

1. **Community write model** → **Open + admin moderation.** Anonymous public writes match the
   design; guardrails = rate limiting, 8 MB image-type caps, and an admin delete/hide path.
   **Plus bot protection** (Cloudflare **Turnstile** — we're already on CF) on every public write
   endpoint, including the anonymous RSVP quick-yes in Phase 4. _(Applies to Phases 4–6.)_
2. **Photo upload trust** → covered by #1 (size/type limits, rate limit, Turnstile, admin hide/delete).
3. **Trips: poll vs. status+comments** → **Keep the existing date-poll AND add "Trip talk" comments.**
   Map the poll to the `planning` status; `open` status shows RSVP + comments. _(Phase 7.)_
4. **Programs vs. hardcoded brands** → **Reuse the `programs` table** to power the 3 brands; per-brand
   _typography_ is a code-level mapping keyed by `kind`.
5. **Newsletter** → **Keep** as a footer signup.

**This plan covers Phases 1–4 only** (design system → landing → section pages → RSVP widget).
Phases 5–8 (albums, board, trip comments, reconciliation, polish) are planned separately.

---

## 7. Suggested build phases

1. **Design system foundation** — fonts, 3-brand tokens, base atoms (`.btn/.field/.card/.chip`),
   motion CSS, `Reveal`/`Photo` components. No new backend.
2. **Landing rebuild** — three brand panels + dinner video hero, driven by `programs`. Import assets.
3. **Section pages (read-only parts)** — hero, chips, "how it works"/route strip, computed next-event.
4. **RSVP widget** — relax `rsvps` schema (anonymous + optional email + quick-yes), port widget,
   headcount + recent names.
5. **Photo albums** — `albums`/`album_photos` tables, R2 upload action (+ admin moderation), UI.
6. **Community board + trip comments** — tables, public actions w/ anti-abuse, UI.
7. **Trip reconciliation** — status model + "Trip talk".
8. **Polish** — footer, nav brand-styling, reduced-motion QA, real names/colors replacing placeholders.

Phases 1–4 are a coherent first milestone (the visible redesign + working RSVPs) with modest backend
risk; 5–6 carry the real community-write complexity.

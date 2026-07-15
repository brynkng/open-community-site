# Handoff: South Philly Community Site (Sidewalk Story · Nomad Bike Philly · Field Trip Philly)

## Overview
A community organization site for South Philly with **three separately-branded sections** sharing one front door:

1. **Sidewalk Story** — free wood-fired pizza dinners, every **Saturday at 6 PM**, hosted (host kept anonymous — "your host") in a South Philly backyard. Recurring RSVP.
2. **Nomad Bike Philly** — no-drop group rides, every **Sunday at 10 AM**, ~10 miles up the Schuylkill to Manayunk, coffee on Main St, ~10 miles back (20 mi round trip).
3. **Field Trip Philly** — planned camping/hiking trips (e.g. Wharton State Forest, Ricketts Glen). Open to all, free unless real costs (lodging/site fees) must be split; each trip has its own RSVP + discussion.

Every section shares three community features:
- **RSVP** without an account — quick 👍 OR name + guest count.
- **Shared photo albums** — no account needed to upload; a main album grouped by date, plus special named albums. Dinners → date-grouped; each ride and each trip gets its own album.
- **Reddit-style board** — separate board per section: posts, upvote/downvote, threaded comments.

The **landing page** shows all three brands as full-height panels with photos drifting behind each (the dinners panel uses a looping background video). Mobile is a scroll journey; tapping a panel enters that section.

## About the Design Files
The files in this bundle are **design references created in HTML/React (via inline Babel)** — prototypes showing intended look and behavior, **not production code to copy directly**. The task is to **recreate these designs in the target production stack: TypeScript + React + Mantine UI**, using popular animation libraries (e.g. Framer Motion / Motion, plus a scroll-reveal approach). If starting fresh, scaffold with Vite + React + TS + Mantine.

State/persistence in the prototype is `localStorage` only (see `data.js`) — production should replace this with a real backend/API (accounts optional; RSVPs, posts, comments, and photo uploads are all anonymous-capable by design).

## Fidelity
**High-fidelity.** Final colors, typography, spacing, layout, and interactions are all specified. Recreate pixel-close using Mantine primitives themed to the tokens below. Animations (drift, float, scroll-reveal, thumbs pop, marquee) are intended and specified.

## Brands & Design Tokens

### Sidewalk Story (dinners) — `scope: dinners`
- Display font: **Alfa Slab One** (Google). Body: **Karla**.
- Colors: bg `#F7ECCB` / deep `#F1E2B5`; primary red `#A8332A`, red-deep `#7E241D`; brown `#7A4A21`; ink `#33231A`.
- Logo: `assets/sidewalk-story.png` (circular illustrated stamp).
- Looping background video: **`assets/dinner-bg.mp4`** (landscape/desktop) and **`assets/dinner-bg-mobile.mp4`** (vertical/mobile). Always muted (force `muted` + `defaultMuted` + `volume=0`, autoplay, loop, playsInline). Swap source by `matchMedia('(max-width: 700px)')`.

### Nomad Bike Philly (rides) — `scope: bikes`
- Display font: **Archivo** (heavy: weight 800–900, `font-stretch: 115–125%`, uppercase). Body: Karla.
- Colors: bg `#F4F0E6`; navy `#1F3A63`, navy-deep `#14294A`; steel `#5B7FA6`; coffee `#6F4A2B`; ink `#1C2634`.
- Logo: `assets/nomadic-bike.jpg` (circular navy badge).

### Field Trip Philly (trips) — `scope: trips`
- Display font: **Bricolage Grotesque** (weight 700–800). Body: Karla.
- Colors: bg `#EFF2E4`; green `#2E5339`, green-deep `#1F3B28`; moss `#6A8F5C`; ember `#C96F3B`; ink `#21301F`.
- No logo yet — uses a ⛺ ember-circle mark as placeholder.

### Shared
- Paper `#FBF6E9`, ink `#2B2118`, muted `#7D6F5E`.
- Radius: cards `14px`, buttons pill `999px`, text plates `16px`.
- Shadow: `0 2px 6px rgba(43,33,24,.08), 0 12px 32px rgba(43,33,24,.10)`.
- Buttons: pill, weight 700, min-height 44px; hover `translateY(-2px)` + shadow; per-brand `accent` fill.
- Field inputs: 2px border `rgba(43,33,24,.18)`, radius 10, focus → currentColor border + 3px halo.
- Full CSS token list + primitives in `styles.css` (`:root` vars).

## Screens / Views

### 1. Landing (`#/`)
- **Layout**: sticky top nav; centered hero (chip + huge headline "One neighborhood. Three ways to show up." in Bricolage 800 + muted subline); then three stacked full-height (`78vh`) brand panels. Tweak `landingLayout` toggles `stack` (default) vs `grid` (side-by-side auto-fit).
- **Panels**: each links to its section, shows brand badge/logo, `when` label, headline (per-brand display font), sub, and a light CTA button.
  - Bikes & Trips panels: 2–3 album photos absolutely positioned, drifting (`drift` keyframe, ease-in-out alternate ~14s), plus bottom vignette for legibility.
  - **Dinners panel** uses the looping video (cover, full width) with top/bottom vertical **mask fade** (`linear-gradient(180deg, transparent, #000 16%, #000 74%, transparent)`) blending into a **black** panel background. Text sits in the current `split-band` layout: a left plate (badge label + headline) and a right plate (sub + CTA), each on a **mostly-black rounded backing** `rgba(0,0,0,.68)` + `blur(4px)`, radius 16. (Other layouts exist as a tweak `dinnerLayout`: `lower-band`, `split`, `stacked`.)
- **Marquee** of album photos was removed from the hero per user request — do not reintroduce.

### 2. Dinners — Sidewalk Story (`#/dinners`)
- Fixed **looping video backdrop** for the whole page (responsive src), with an **84% cream scrim** (`color-mix(in oklab, var(--ss-bg) 84%, transparent)`) over it so content reads.
- Hero: brand logo (`min(230px, 52%)`, `mix-blend: multiply`, gentle float), headline, intro copy (free, bring nothing, "seen us on social? that invite means you"), chips (🍕 Wood-fired · 🐶 Dog-friendly · 💸 Always free). Right column: red "Next dinner" card computing the **next Saturday** date + RsvpWidget.
- "How it works" 3-card row. Then **AlbumSection** (date-grouped) and **Board**.

### 3. Rides — Nomad Bike Philly (`#/bikes`)
- Hero: circular logo, heavy uppercase Archivo headline, intro (Sunday 10 AM, no-drop, all bikes), chips (☕ Coffee stop · 🚳 No-drop · 🛤 Mostly trail). Right: navy "Next ride" card computing **next Sunday** + RsvpWidget.
- **Route strip** card: 4 timeline stops (South Philly 0mi → Schuylkill River Trail 3mi → Manayunk/Main St 10mi coffee → back 20mi) with dotted connectors; coffee stop dot in coffee color.
- **AlbumSection** (one album per ride) + **Board**.

### 4. Trips — Field Trip Philly (`#/trips`)
- Hero: ⛺ ember mark + Bricolage headline + intro (free unless real costs, said up front).
- **TripCard** list: status chip (RSVPs open / Still planning), name, dates, blurb, cost + meet info, expandable "RSVP & discussion" → RsvpWidget + **TripComments** (per-trip comment thread, separate from the section Board). Dashed "Got a trip idea?" prompt card.
- **AlbumSection** (one album per trip) + **Board**.

## Components (shared — see `shared.jsx`)
- **TopNav** — sticky, blurred, brand-tinted background; brand logo swaps in upper-left per active section (SP mark on home); links Home/Dinners/Rides/Trips with active pill.
- **RsvpWidget(eventId, brand, prompt)** — "X in so far" chip; big **Quick yes 👍** toggle (fills accent when on, pop animation) OR name + guests(1–6) form; shows recent RSVP names + thumbs count; "See you there! 🎉" confirmation. No account.
- **Board(section, brand)** — "+ New post" composer (title, optional body, optional name); post list.
- **Post** — vote column (▲ count ▼, one-vote lock), title (click to expand), author·time, body, comment count toggle, threaded comments + reply form (reply + optional name).
- **AlbumSection(section, brand)** — album chips (name · count, active = accent); "+ New album" (name it) and "⬆ Add photos" (file input, no account, up to 6, `FileReader` → dataURL). Photos **grouped by date** with a formatted date header per group; reveal-on-scroll grid.
- **Photo** — real `<img>` when `src` present (clean, no caption overlay); otherwise a per-brand oklch gradient placeholder **with** caption label. Production: replace placeholders with real photos.
- **Reveal** — IntersectionObserver fade/translate-up; delay tiers d1–d3. Respects `prefers-reduced-motion`.
- **SectionFooter** — "Made with love in South Philly…" + brand links.

## Interactions & Behavior
- **Routing**: hash-based (`#/`, `#/dinners`, `#/bikes`, `#/trips`); scroll to top on change. Production: real router.
- **Animations**: scroll-reveal (0.7s cubic-bezier), panel photo drift, logo float, thumbs `pop` (spring scale), landing marquee (removed from hero but keyframe remains). All scale off `--anim-mult` (Tweak "Animation intensity", 0 disables).
- **Next-event dates** computed live (next Saturday 6 PM / next Sunday 10 AM).
- **Responsive**: single-column stacks under ~700px; nav labels tighten and brand word hides under 640px; dinner video swaps to vertical source under 700px. Min hit target 44px.
- **Video**: always muted, autoplay, loop, playsInline; muting re-enforced on `loadeddata`/`play`.

## State Management (prototype = localStorage `spc_store_v1`, see `data.js`)
- `rsvps[eventId]` → `[{name, guests, ts}]`; `thumbs[eventId]`, `myThumbs[eventId]`.
- `albums[]` → `{id, section, name, main, photos:[{id,date,src|hue/brand,cap}]}`.
- `posts[section][]` → `{id,title,body,author,ts,votes,comments:[{author,text,ts}]}`.
- `trips[]` → `{id,name,dates,status,blurb,cost,meet}`; `tripComments[key][]`.
- Store versioned (`__v`); bump reseeds. **Production**: replace with API + DB; keep anonymous-capable RSVP/upload/post; consider photo storage (S3/Cloud) + Instagram Graph API if auto-importing IG posts (noted: scraping IG is not viable; use official embeds or Graph API).

## Assets (in `assets/`)
- `sidewalk-story.png` — Sidewalk Story circular logo.
- `nomadic-bike.jpg` — Nomad Bike Philly badge.
- `dinner-bg.mp4` — **landscape** dinner background video (desktop).
- `dinner-bg-mobile.mp4` — vertical dinner background video (mobile).
- `photos/` — real dinner + ride photos used in albums/panels.
- Field Trip Philly has **no logo yet** — needs one designed.

## Files (design reference)
- `index.html` — shell + script load order (React 18 + Babel; then data.js, tweaks-panel, shared, landing, dinners, bikes, trips, app).
- `styles.css` — all tokens, primitives, animation keyframes.
- `data.js` — seed data + `window.SPC` storage API.
- `shared.jsx` — BRANDS, Photo, Reveal, RsvpWidget, Board/Post, AlbumSection, TopNav, SectionFooter.
- `landing.jsx` — Landing + LandingPanel/DinnerPanel (all dinner layout variants).
- `dinners.jsx` / `bikes.jsx` / `trips.jsx` — the three sections.
- `app.jsx` — hash router + Tweaks panel (animation intensity, landing layout, dinner panel text, copy voice, per-section accents).

## Notes
- Copy voice has two variants (`warm` default / `direct`) — see `copyVariant` usage; keep "warm & neighborly" as the shipping default.
- Host is intentionally **anonymous** ("your host"). Address is "DM us on social for the address" — don't publish it.

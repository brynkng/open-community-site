---
title: The Programs layer — branded event series with no code
type: architecture
area: programs
tags: [programs, branding, extensibility, kind, admin, homepage]
status: current
created: 2026-07-14
source_files:
  - src/lib/programs.ts
  - src/app/page.tsx
  - src/app/layout.tsx
  - src/components/ProgramHeader.tsx
  - src/components/ProgramBadge.tsx
  - src/components/ProgramSelect.tsx
  - src/components/ProgramCreateForm.tsx
  - src/app/admin/actions.ts
---

# The Programs layer

Programs let organizers add new **branded event series** from the admin **with no code**. The core
insight (documented at `src/db/schema.ts` near the `programs` table): a program's `kind`
(`dinner | ride | trip`) selects which _existing_ event behavior it reuses. So a second ride group
or supper club needs only a new `programs` row — rendering, RSVP, poll, and cron logic already key
off `kind` + `programId`.

**Rule of thumb:** a new branded series = **data, not code**. Only a genuinely new `kind` (new
behavior) requires code — a new page branch, a new event table, a homepage `itemsForProgram` branch,
and a nav `programHref` branch.

## Query helpers (`src/lib/programs.ts`)

- `getActivePrograms()` — active, ordered by `(sortOrder, id)`; drives homepage sections and nav.
- `getAllPrograms()` — admin management view.
- `getProgramsByKind(kind)` — active programs of one kind; populates the event-creation picker.
- `getProgramById(id)` / `getProgramBySlug(slug)` — null-safe single lookups.
- `defaultProgramIdForKind(kind)` — first active program of a kind; the fallback `programId` when an
  event is created without an explicit pick (used in `createDinnerAction`/`createRideAction`/
  `createTripAction`).

## How a program shapes the app

- **Homepage** (`src/app/page.tsx`): iterates active programs; `itemsForProgram(p)` branches on
  `p.kind` to fetch the next dinner / next 3 rides / latest 3 trips, each with a kind-specific CTA.
  Every section is styled entirely from `program.accentColor` (border, gradient, button) and
  `logoUrl` (or a first-letter fallback avatar).
- **Nav** (`src/app/layout.tsx`): one link per active program via `programHref(p)` (kind →
  `/dinner | /rides | /trips?program=<slug>`), with a hard-coded fallback nav if the programs query
  fails (`safePrograms()` swallows errors).
- **Filtered list pages**: `?program=<slug>` filters each list — `rides/page.tsx` and
  `dinner/page.tsx` add `eq(table.programId, program.id)` when a slug is present and render a
  `<ProgramHeader>`.

## Program components

- `ProgramHeader` — branded banner atop a filtered list (logo/avatar + name + tagline, accent-colored).
- `ProgramBadge` — small linked chip on detail pages; builds the `?program=` href from `kind`.
- `ProgramSelect` — event-creation picker: renders nothing for 0 programs, a **hidden input** for
  exactly 1 (auto-selected), a `<select>` for many. Emits `name="programId"`.
- `ProgramCreateForm` — client form (`useActionState` → `createProgramAction`): name, kind, tagline,
  color picker, sortOrder, logo upload.

## Admin actions (`src/app/admin/actions.ts`)

- `createProgramAction` — validates name + kind, slugifies name with a 2-byte random suffix, uploads
  logo to R2 via `uploadLogo()` (`brands/<slug>-<rand>.<ext>`), inserts the program, revalidates
  `/admin/programs` and `/`.
- `updateProgramAction` — edits name/tagline/accentColor/sortOrder/active; replaces logo only if a
  new file is provided.

Admin UI: `src/app/admin/programs/page.tsx`.

## Placeholders to be aware of

Seeded program colors/taglines (migration `0004`) are placeholders. Site title
(`NEXT_PUBLIC_SITE_NAME`) is "Our Community" — likely should be "Sidewalk Story".

See [[data-model-and-database]] and [[coding-conventions]].

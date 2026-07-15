---
title: Recurring event series — template + cron materializer (not fan-out)
type: architecture
area: database
tags: [recurring, series, cron, materializer, idempotent, dinners, rides, rsvp]
status: current
created: 2026-07-15
source_files:
  - src/lib/series.ts
  - src/app/api/cron/generate-events/route.ts
  - src/app/admin/actions.ts
  - src/components/ScheduleFields.tsx
  - migrations/0010_recurring_series.sql
  - src/db/schema.ts
  - cron-worker/index.js
---

# Recurring event series

Weekly-recurring dinners ("every Saturday") and rides ("every Sunday") are modeled as a
**template row + daily cron materializer**, not by fanning out concrete dates at creation time.
One-off events are unchanged — they're just a normal `dinners`/`rides` row with `series_id` NULL.

## The load-bearing decision: keep one row per dated instance

The existing invariant across the app is **one row per dated event**: per-date RSVPs/headcounts
(`rsvps.refId`), day-before reminders (`rsvps.reminderSentAt`), and Instagram posting (`igPosts.refId`)
all key off an instance's `id`. A recurrence feature must not break that.

So a series does **not** store "every Saturday" as a rule the rendering/RSVP/reminder code has to
interpret. Instead the cron **materializes** the rule into ordinary instance rows, each with its own
`id`, linked back via a new `series_id` column. Net effect: **zero changes to rendering, RSVP,
reminder, or IG code** — they keep operating on plain `dinners`/`rides` rows and never learn that
series exist. This is the same "generate data, not new code paths" instinct as
[[programs-layer-architecture]] (a new branded series is a `programs` row, not code).

Template-and-materialize was chosen over **fan-out-at-creation** (insert N dated rows when the
organizer clicks save) because materialization keeps a rolling horizon stocked forever, survives an
organizer editing/pausing the series later, and needs no "how many should I create?" guess.

## Schema (`migrations/0010`, `event_series` + `series_id`)

`event_series` holds `program_id`, `kind` (`dinner|ride`), `weekday` (0=Sun…6=Sat, JS `getUTCDay`
convention), `start_time`, the **shared defaults copied onto every instance** (title, description,
location, plus kind-specific capacity / distance_km / pace_level / route_url / image_key),
`horizon_weeks` (default 8), and `active`. Follows every schema convention in
[[data-model-and-database]]: epoch-int `created_at`, TEXT enums (app-enforced), named indexes,
**no FK constraints** (`series_id` / `program_id` are convention-only links), idempotent
`CREATE ... IF NOT EXISTS` SQL applied via wrangler. Index `event_series_active_idx (active, kind)`
drives the materializer's "active series" scan; `dinners_series_idx` / `rides_series_idx`
`(series_id, date)` drive the idempotency check and delete.

## The materializer (`src/lib/series.ts`)

- `upcomingWeekdayDates(weekday, count, fromISO)` — pure date math in **UTC** (all app dates are
  UTC ISO `YYYY-MM-DD`). `delta = (weekday - start.getUTCDay() + 7) % 7`; if today already is the
  target weekday, today is the first date.
- `materializeOne(db, series, fromISO)` — computes the next `horizon_weeks` wanted dates, selects
  which already exist **for this series**, inserts only the missing ones. **Idempotent** — safe to
  run on every trigger. Returns count created.
- `materializeAll(fromISO)` — loops active series, sums instances created.

`materializeAll` runs from **two** places: the daily cron route
`GET /api/cron/generate-events` (added to the companion `cron-worker/index.js` job list, authorized
via `authorizeCron`), and **inline right after series creation** in the admin action, so instances
appear immediately instead of waiting for the next cron tick.

## Admin UX (`ScheduleFields` on the existing forms)

No separate series-management surface. The New Dinner / New Ride forms gained a **"Repeats weekly"**
checkbox (`ScheduleFields.tsx`) that swaps the single-date input for a weekday picker;
`createDinnerAction` / `createRideAction` branch on it (series row + inline materialize vs. one plain
instance). The admin dashboard lists active series with pause/resume (`setSeriesActiveAction`) and
delete. **Weekly cadence only** — no biweekly/monthly (deliberately out of scope).

## Delete detaches RSVPed instances — never orphans attendees

`deleteSeriesAction` walks upcoming instances of the series: any that **already have RSVPs** are
**detached** (`series_id = null`, row kept so attendees keep their spot); un-RSVPed upcoming ones are
deleted; past instances are detached. Then the `event_series` row is removed. Because the schema has
**no FK cascades** (convention-only, per [[data-model-and-database]]), this cleanup is explicit app
code — same pattern as `deleteContentAction`.

## Gotcha — local D1 migration drift (not caused by this change)

`npm run db:migrate:local` failed before reaching 0010: 0009's `thumb_key` column already existed on
the local DB but wasn't recorded as applied in `d1_migrations`, so 0009 re-ran and died on
"duplicate column". Because migrations are hand-written idempotent SQL applied by wrangler
(drizzle-kit is generate-only here), the fix was to apply 0010 directly with
`wrangler d1 execute --local --file migrations/0010_recurring_series.sql`. Watch for this whenever a
local D1 has diverged from the `d1_migrations` ledger; it is not specific to this feature.

See [[data-model-and-database]], [[programs-layer-architecture]], and [[app-architecture-and-integrations]].

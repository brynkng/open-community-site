---
title: Converting a one-off event into a recurring series — set seriesId + date, then let the materializer dedupe
type: architecture
area: database
tags:
  [
    recurring,
    series,
    materializer,
    idempotent,
    dinners,
    rides,
    admin,
    edit,
    convert,
  ]
status: current
created: 2026-07-15
source_files:
  - src/lib/series.ts
  - src/components/MakeRecurringFields.tsx
  - src/app/admin/actions.ts
  - src/components/RideEditForm.tsx
  - src/app/admin/rides/[id]/page.tsx
---

# Converting a one-off event into a recurring series

The admin edit forms for a **one-off** dinner or ride (`seriesId == null`) expose a
**"Make recurring"** toggle (`src/components/MakeRecurringFields.tsx`). Checking it, on save:

1. Creates an `event_series` row from the current event's details + a chosen weekday
   (defaulting to the event's own date-weekday).
2. Sets the **current row's** `seriesId` to the new series.
3. Calls `materializeOne(db, series, todayISO())` to stock upcoming instances.

## The load-bearing detail: the existing row is absorbed, not duplicated

The obvious worry is that materializing the new series would re-create the event you just
edited (its date is one of the series' upcoming weekday dates). It doesn't — **because you set
the current row's `seriesId` and it already carries its own date before you materialize.**

`materializeOne` (in [[recurring-event-series-materializer]]) dedupes by **`(seriesId, date)`**:
it selects existing instances for the series among the wanted dates and inserts only the
missing ones. Since the just-edited row is now an instance of the series _on that date_, the
dedupe sees it as already present and skips it. Ordering matters: **write `seriesId` first,
materialize second.** Reverse the order and the same date gets a duplicate instance.

This is the same idempotency property the daily cron relies on — the conversion flow just
leans on it deliberately instead of adding special "don't duplicate the seed row" logic.

## Why events already in a series don't show the toggle

If an event already has a `seriesId`, `MakeRecurringFields` is hidden and replaced with a note
pointing at the dashboard to pause/delete the series. This avoids ambiguous double-recurrence
(a row belonging to two series, or a second series colliding on the same weekday/dates).

## Convention: edit forms stay separate from create forms

Edit forms are intentionally **not** the create forms. Create uses `ScheduleFields`, which
_swaps_ the date input for a weekday picker and has redirect semantics. Edit **always shows the
prefilled date PLUS an optional additive "Make recurring" toggle** — you are editing a concrete
dated instance and optionally promoting it to a series, not defining a series from scratch.

Related ride-edit detail: cover-image re-upload reuses the same R2 key
(`rides/${slug}.${ext}`) for URL stability, and ride distance is stored as km but shown/edited
in miles via `kmToMiles` / `milesToKm`.

See [[recurring-event-series-materializer]], [[data-model-and-database]], and
[[programs-layer-architecture]].

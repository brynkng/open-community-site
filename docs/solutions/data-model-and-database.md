---
title: Data model & database schema (D1 + Drizzle)
type: architecture
area: database
tags: [d1, drizzle, schema, migrations, rsvp, trips, programs]
status: current
created: 2026-07-14
source_files:
  - src/db/schema.ts
  - src/db/index.ts
  - migrations/0001_init.sql
  - migrations/0002_trips.sql
  - migrations/0003_trip_notify.sql
  - migrations/0004_programs.sql
---

# Data model & database

Cloudflare **D1 (SQLite)** accessed through **Drizzle ORM** (`^0.36.4`). Schema and all
row types live in `src/db/schema.ts`; the client is created per-request in `src/db/index.ts`.

## DB client

`getDb()` (`src/db/index.ts`) calls `getCloudflareContext().env.DB` and wraps it with
`drizzle(env.DB, { schema })`. It is **per-request — never a module-level singleton**. Works in
`next dev` via `initOpenNextCloudflareForDev()` (`next.config.ts`) and in production. All tables
are re-exported as `schema`.

## Cross-cutting schema conventions

- Integer autoincrement `id` primary key on every table.
- Timestamps are **Unix epoch integers**, SQL default `(unixepoch())`, mapped to JS `Date` via
  Drizzle `mode:"timestamp"`. Booleans via `mode:"boolean"` (0/1).
- Enum columns are **TEXT** with a Drizzle `enum` constraint — **app-level only**; SQLite does not
  enforce it.
- **No foreign-key constraints are declared.** `programId`, `refId`, `tripId`, `optionId` are plain
  integers linked by convention. Integrity is enforced in app code and via UNIQUE indexes.
- Indexes are explicitly named in the table's third arg.

## Tables

| Table             | Purpose                                              | Key columns                                                                                                         | Notable indexes                                                                      |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `programs`        | Branded event series (the central abstraction)       | `slug` unique, `kind` enum `dinner\|ride\|trip`, `accentColor` default `#c2410c`, `sortOrder`, `active`             | `programs_active_idx (active, sortOrder)`                                            |
| `dinners`         | One row per dated Saturday dinner                    | `programId?`, `date` ISO, `capacity?` (null = unlimited), `status` enum                                             | —                                                                                    |
| `rides`           | Sunday ride content                                  | `programId?`, `slug` unique, `distanceKm`, `paceLevel` enum `social\|moderate\|spirited`, `imageKey` (R2), `status` | `rides_date_idx (date)`                                                              |
| `rsvps`           | **Polymorphic** RSVPs for dinners & rides (no login) | `kind` enum `dinner\|ride`, `refId`, `email`, `partySize`, `reminderSentAt?`                                        | `rsvps_target_idx (kind, refId)`; **UNIQUE** `rsvps_unique_idx (kind, refId, email)` |
| `subscribers`     | Newsletter list                                      | `email` unique, `confirmed` (default false but insert sets true), `unsubToken`                                      | —                                                                                    |
| `igPosts`         | Instagram publish audit log                          | `kind` enum `dinner\|ride\|manual`, `refId?`, `igMediaId?`, `status` enum `pending\|published\|failed`              | —                                                                                    |
| `trips`           | One-off larger trips                                 | `programId?`, `slug` unique, `finalDate?`, `finalDateNotified?`, `pollOpen`, `imageKey` (R2)                        | `trips_status_idx (status)`                                                          |
| `tripInterest`    | Interest / headcount list                            | `tripId`, `email`, `partySize`                                                                                      | `trip_interest_trip_idx`; **UNIQUE** `(tripId, email)`                               |
| `tripPollOptions` | Candidate dates                                      | `tripId`, `label`, `sortOrder`                                                                                      | `trip_poll_options_trip_idx`                                                         |
| `tripPollVotes`   | Approval-style availability votes                    | `tripId`, `optionId`, `voterEmail`                                                                                  | `trip_poll_votes_trip_idx`; **UNIQUE** `(optionId, voterEmail)`                      |

Exported row types (`schema.ts` bottom): `Program`, `Dinner`, `Ride`, `Rsvp`, `Subscriber`,
`IgPost`, `Trip`, `TripInterest`, `TripPollOption`, `TripPollVote` (via `typeof table.$inferSelect`).

## Relationships (convention-only, no DB FKs)

- `programs 1─* dinners|rides|trips` via nullable `programId` (events can be program-less and fall
  back — see [[programs-layer-architecture]]).
- `rsvps *─1 dinners|rides` via polymorphic `(kind, refId)`.
- `trips 1─* tripInterest | tripPollOptions | tripPollVotes` via `tripId`.
- `tripPollVotes *─1 tripPollOptions` via `optionId`.

## Migration evolution

Hand-written, additive, **idempotent** SQL (`CREATE ... IF NOT EXISTS`), applied **via wrangler**
(`npm run db:migrate:local` / `:remote`), **not** drizzle-kit (which is generate-only and bypassed
here). Numbered `migrations/NNNN_name.sql`.

- **0001_init** — dinners, rides, rsvps, subscribers, ig_posts.
- **0002_trips** — trips, trip_interest, trip_poll_options, trip_poll_votes.
- **0003_trip_notify** — `ALTER TABLE trips ADD COLUMN final_date_notified` (notify-once-per-date).
- **0004_programs** — creates `programs`; adds `program_id` to dinners/rides/trips; **seeds three
  programs with fixed ids 1/2/3** (nomadic-bike-philly=ride, saturday-dinner=dinner,
  community-trips=trip) and backfills existing events. Fixed ids make the backfill deterministic.
- **0010_recurring_series** — creates `event_series` (weekly template) and adds `series_id` to
  dinners/rides (NULL = one-off). A daily cron materializes each active series into ordinary dated
  instance rows. See [[recurring-event-series-materializer]].

## When adding to the schema

Follow the conventions above: epoch-integer `createdAt`, TEXT enums, named indexes, no FK
constraints, UNIQUE index for dedupe on polymorphic/cross-event tables. Keep new migrations in the
same hand-written idempotent style and numbering. Seed with fixed ids only when later code depends
on them (as `0004` does). See [[coding-conventions]].

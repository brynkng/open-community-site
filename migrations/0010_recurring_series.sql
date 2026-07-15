-- v7: Recurring event series. A weekly template (weekday + time + shared
-- defaults) that a daily cron materializes into normal `dinners`/`rides` rows.
-- Each generated instance keeps its own record (so per-date RSVPs/headcounts
-- keep working) and links back via `series_id`. One-off events are unchanged:
-- they're just a row with `series_id` NULL.

CREATE TABLE IF NOT EXISTS event_series (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER,              -- FK -> programs.id (convention-only)
  kind TEXT NOT NULL,              -- "dinner" | "ride"
  weekday INTEGER NOT NULL,        -- 0=Sun … 6=Sat (JS getUTCDay convention)
  start_time TEXT,                 -- e.g. "18:30"
  -- shared defaults copied onto every generated instance:
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,                   -- dinner location / ride meeting point
  capacity INTEGER,                -- dinner only (null = unlimited)
  distance_km INTEGER,             -- ride only
  pace_level TEXT,                 -- ride only
  route_url TEXT,                  -- ride only
  image_key TEXT,                  -- ride only (R2 cover, reused for each instance)
  horizon_weeks INTEGER NOT NULL DEFAULT 8,  -- how many future weeks to keep materialized
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS event_series_active_idx ON event_series (active, kind);

-- Link generated instances back to their series (NULL = one-off).
ALTER TABLE dinners ADD COLUMN series_id INTEGER;
ALTER TABLE rides   ADD COLUMN series_id INTEGER;
CREATE INDEX IF NOT EXISTS dinners_series_idx ON dinners (series_id, date);
CREATE INDEX IF NOT EXISTS rides_series_idx   ON rides (series_id, date);

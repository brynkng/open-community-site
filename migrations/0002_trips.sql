-- v2: one-off trips with interest gathering + a best-time poll.
-- Applied via: wrangler d1 migrations apply community_db --local  (or --remote)

CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  destination TEXT,
  description TEXT,
  image_key TEXT,
  tentative_window TEXT,
  est_cost TEXT,
  final_date TEXT,
  poll_open INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'published',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS trips_status_idx ON trips (status);

CREATE TABLE IF NOT EXISTS trip_interest (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS trip_interest_trip_idx ON trip_interest (trip_id);
CREATE UNIQUE INDEX IF NOT EXISTS trip_interest_unique_idx ON trip_interest (trip_id, email);

CREATE TABLE IF NOT EXISTS trip_poll_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS trip_poll_options_trip_idx ON trip_poll_options (trip_id);

CREATE TABLE IF NOT EXISTS trip_poll_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  option_id INTEGER NOT NULL,
  voter_email TEXT NOT NULL,
  voter_name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS trip_poll_votes_trip_idx ON trip_poll_votes (trip_id);
CREATE UNIQUE INDEX IF NOT EXISTS trip_poll_votes_unique_idx ON trip_poll_votes (option_id, voter_email);

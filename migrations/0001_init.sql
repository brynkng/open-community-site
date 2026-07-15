-- Initial schema for the community site.
-- Applied via: wrangler d1 migrations apply community_db --local  (or --remote)

CREATE TABLE IF NOT EXISTS dinners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Saturday Community Dinner',
  description TEXT,
  location TEXT,
  start_time TEXT,
  capacity INTEGER,
  status TEXT NOT NULL DEFAULT 'published',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS rides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT,
  meet_location TEXT,
  distance_km INTEGER,
  pace_level TEXT,
  route_url TEXT,
  description TEXT,
  image_key TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS rides_date_idx ON rides (date);

CREATE TABLE IF NOT EXISTS rsvps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  ref_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  party_size INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  reminder_sent_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS rsvps_target_idx ON rsvps (kind, ref_id);
CREATE UNIQUE INDEX IF NOT EXISTS rsvps_unique_idx ON rsvps (kind, ref_id, email);

CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  confirmed INTEGER NOT NULL DEFAULT 0,
  unsub_token TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS ig_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  ref_id INTEGER,
  caption TEXT NOT NULL,
  image_key TEXT NOT NULL,
  ig_media_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  published_at INTEGER
);

-- v4: photo albums (anonymous upload) + a shared per-IP rate-limit ledger.
-- Applied via: wrangler d1 migrations apply community_db --local  (or --remote)

CREATE TABLE IF NOT EXISTS albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER,
  name TEXT NOT NULL,
  main INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS albums_program_idx ON albums (program_id);

CREATE TABLE IF NOT EXISTS album_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id INTEGER NOT NULL,
  taken_date TEXT,
  image_key TEXT NOT NULL,
  caption TEXT,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS album_photos_album_idx ON album_photos (album_id);

-- Shared per-IP rate-limit ledger for every public community write (KTD4).
-- `bucket` = "<action>:<hashedIp>" — the IP is hashed before it ever reaches
-- this table; a row is a single hit, counted within a rolling window in app code.
CREATE TABLE IF NOT EXISTS rate_hits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bucket TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS rate_hits_bucket_idx ON rate_hits (bucket, created_at);

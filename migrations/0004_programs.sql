-- v3: Programs — branded event series (each with its own logo, color, tagline).
-- Existing dinners/rides/trips become events under a seeded program.

CREATE TABLE IF NOT EXISTS programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  logo_url TEXT,
  accent_color TEXT NOT NULL DEFAULT '#c2410c',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS programs_active_idx ON programs (active, sort_order);

-- Add the program link to each event type.
ALTER TABLE dinners ADD COLUMN program_id INTEGER;
ALTER TABLE rides ADD COLUMN program_id INTEGER;
ALTER TABLE trips ADD COLUMN program_id INTEGER;

-- Seed the starter programs (fixed ids so backfill is deterministic).
INSERT INTO programs (id, slug, name, kind, tagline, logo_url, accent_color, sort_order)
VALUES
  (1, 'nomadic-bike-philly', 'Nomadic Bike Philly', 'ride',
   'Bikes, coffee, and the best of Philly on two wheels.',
   '/brands/nomadic-bike-philly.jpg', '#1e3a5f', 1),
  (2, 'saturday-dinner', 'Saturday Dinner', 'dinner',
   'A free table, open to all, every Saturday.',
   NULL, '#c2410c', 2),
  (3, 'community-trips', 'Community Trips', 'trip',
   'Bigger adventures, planned together.',
   NULL, '#0f766e', 3);

-- Backfill any events created before programs existed.
UPDATE rides   SET program_id = 1 WHERE program_id IS NULL;
UPDATE dinners SET program_id = 2 WHERE program_id IS NULL;
UPDATE trips   SET program_id = 3 WHERE program_id IS NULL;

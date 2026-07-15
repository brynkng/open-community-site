-- Relax rsvps for anonymous RSVPs: quick-yes (no name/email) and named-without-email.
-- Applied via: wrangler d1 migrations apply community_db --local  (or --remote)

-- Marks quick-yes (anonymous, no name/email) RSVPs so headcount math and UI can
-- distinguish them from named RSVPs. Added first so the table rebuild below
-- (which reads from the live `rsvps` table) carries it over.
ALTER TABLE rsvps ADD COLUMN quick INTEGER NOT NULL DEFAULT 0;

-- The old UNIQUE index can't allow multiple anonymous (NULL-email) rows to
-- coexist, and anonymous rows have no email at all — drop it. Dedupe for named
-- RSVPs with an email now happens in rsvpAction (app-level).
DROP INDEX IF EXISTS rsvps_unique_idx;

-- `name`/`email` were declared NOT NULL in 0001_init.sql. SQLite has no
-- `ALTER COLUMN ... DROP NOT NULL`, so relaxing that constraint requires the
-- standard rebuild-and-swap: create the new shape, copy rows across, drop the
-- old table, rename the new one into place, then recreate its indexes.
CREATE TABLE IF NOT EXISTS rsvps_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  ref_id INTEGER NOT NULL,
  name TEXT,
  email TEXT,
  party_size INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  reminder_sent_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  quick INTEGER NOT NULL DEFAULT 0
);

INSERT INTO rsvps_new (
  id, kind, ref_id, name, email, party_size, note, reminder_sent_at, created_at, quick
)
SELECT id, kind, ref_id, name, email, party_size, note, reminder_sent_at, created_at, quick
FROM rsvps;

DROP TABLE rsvps;
ALTER TABLE rsvps_new RENAME TO rsvps;

CREATE INDEX IF NOT EXISTS rsvps_target_idx ON rsvps (kind, ref_id);
CREATE INDEX IF NOT EXISTS rsvps_target_email_idx ON rsvps (kind, ref_id, email);

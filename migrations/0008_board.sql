-- v5: community board (posts/comments/votes) + per-trip "Trip talk" comments.
-- Applied via: wrangler d1 migrations apply community_db --local  (or --remote)

CREATE TABLE IF NOT EXISTS board_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER,
  title TEXT NOT NULL,
  body TEXT,
  author_name TEXT,
  vote_score INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS board_posts_program_idx ON board_posts (program_id);

CREATE TABLE IF NOT EXISTS board_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  author_name TEXT,
  text TEXT NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS board_comments_post_idx ON board_comments (post_id);

-- One vote per (post, voter). `dir` is +1/-1; re-voting the same direction is
-- a no-op, switching direction updates the row, clearing deletes it — all
-- handled app-side in voteAction (KTD3).
CREATE TABLE IF NOT EXISTS board_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  voter_key TEXT NOT NULL,
  dir INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS board_votes_post_idx ON board_votes (post_id);
CREATE UNIQUE INDEX IF NOT EXISTS board_votes_unique_idx ON board_votes (post_id, voter_key);

CREATE TABLE IF NOT EXISTS trip_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  author_name TEXT,
  text TEXT NOT NULL,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS trip_comments_trip_idx ON trip_comments (trip_id);

import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

const now = sql`(unixepoch())`;

/**
 * Programs are branded event series (e.g. "Nomadic Bike Philly", "Saturday
 * Dinner"). Each has its own logo, accent color and tagline. A program's `kind`
 * decides which event behavior it uses, so you can add new branded programs of
 * an existing kind (another ride group, a second supper club) with no code.
 */
export const programs = sqliteTable(
  "programs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    kind: text("kind", { enum: ["dinner", "ride", "trip"] }).notNull(),
    tagline: text("tagline"),
    description: text("description"),
    logoUrl: text("logo_url"), // public path (/brands/x.jpg) or R2 URL
    accentColor: text("accent_color").notNull().default("#c2410c"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(now),
  },
  (t) => ({
    activeIdx: index("programs_active_idx").on(t.active, t.sortOrder),
  }),
);

/**
 * Saturday dinners — one row per dated instance (the dinner is weekly, but each
 * Saturday gets its own record so RSVPs and headcounts are per-date).
 */
export const dinners = sqliteTable("dinners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  programId: integer("program_id"), // FK -> programs.id (kind = "dinner")
  date: text("date").notNull(), // ISO date, e.g. 2026-07-11
  title: text("title").notNull().default("Saturday Community Dinner"),
  description: text("description"),
  location: text("location"),
  startTime: text("start_time"), // e.g. "18:30"
  capacity: integer("capacity"), // null = unlimited
  status: text("status", { enum: ["published", "draft", "cancelled"] })
    .notNull()
    .default("published"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(now),
});

/**
 * Sunday bike rides — richer content (route, pace, distance, cover image).
 */
export const rides = sqliteTable(
  "rides",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    programId: integer("program_id"), // FK -> programs.id (kind = "ride")
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    date: text("date").notNull(), // ISO date
    startTime: text("start_time"), // e.g. "09:00"
    meetLocation: text("meet_location"),
    distanceKm: integer("distance_km"),
    paceLevel: text("pace_level", { enum: ["social", "moderate", "spirited"] }),
    routeUrl: text("route_url"), // Strava/RideWithGPS/Komoot link
    description: text("description"), // the "post" body (markdown-ish plain text)
    imageKey: text("image_key"), // R2 object key for the cover image
    status: text("status", { enum: ["published", "draft", "cancelled"] })
      .notNull()
      .default("published"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(now),
  },
  (t) => ({
    dateIdx: index("rides_date_idx").on(t.date),
  }),
);

/**
 * RSVPs for either a dinner or a ride. `kind` + `refId` point at the target.
 * No login required for attendees. Supports three shapes: a quick-yes (no
 * name/email, `quick: true`, `partySize: 1`), a named RSVP with email (app-level
 * deduped on `(kind, refId, email)` in `rsvpAction`), and a named RSVP with no
 * email at all (always inserted — nothing to dedupe on).
 */
export const rsvps = sqliteTable(
  "rsvps",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ["dinner", "ride"] }).notNull(),
    refId: integer("ref_id").notNull(),
    name: text("name"),
    email: text("email"),
    partySize: integer("party_size").notNull().default(1),
    note: text("note"),
    quick: integer("quick", { mode: "boolean" }).notNull().default(false),
    reminderSentAt: integer("reminder_sent_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(now),
  },
  (t) => ({
    targetIdx: index("rsvps_target_idx").on(t.kind, t.refId),
    // Non-unique — dedupe for named RSVPs with an email is app-level in rsvpAction.
    targetEmailIdx: index("rsvps_target_email_idx").on(
      t.kind,
      t.refId,
      t.email,
    ),
  }),
);

/**
 * Newsletter subscribers. Double opt-in supported via `confirmed`.
 */
export const subscribers = sqliteTable("subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name"),
  confirmed: integer("confirmed", { mode: "boolean" }).notNull().default(false),
  unsubToken: text("unsub_token").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(now),
});

/**
 * Log of Instagram publish attempts so the admin UI can show status/errors and
 * we never double-publish the same event.
 */
export const igPosts = sqliteTable("ig_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  kind: text("kind", { enum: ["dinner", "ride", "manual"] }).notNull(),
  refId: integer("ref_id"),
  caption: text("caption").notNull(),
  imageKey: text("image_key").notNull(),
  igMediaId: text("ig_media_id"), // returned by IG on success
  status: text("status", { enum: ["pending", "published", "failed"] })
    .notNull()
    .default("pending"),
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(now),
  publishedAt: integer("published_at", { mode: "timestamp" }),
});

/**
 * One-off larger trips — gather interest + coordinate the best date via a poll.
 */
export const trips = sqliteTable(
  "trips",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    programId: integer("program_id"), // FK -> programs.id (kind = "trip")
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    destination: text("destination"),
    description: text("description"),
    imageKey: text("image_key"), // R2 cover image (also used for IG)
    tentativeWindow: text("tentative_window"), // e.g. "A weekend in late September"
    estCost: text("est_cost"), // freeform, e.g. "$150–200 pp"
    finalDate: text("final_date"), // ISO date, set once decided
    finalDateNotified: text("final_date_notified"), // the final_date value we last emailed about
    pollOpen: integer("poll_open", { mode: "boolean" }).notNull().default(true),
    status: text("status", { enum: ["published", "draft", "cancelled"] })
      .notNull()
      .default("published"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(now),
  },
  (t) => ({
    statusIdx: index("trips_status_idx").on(t.status),
  }),
);

/** People who said they're interested in a trip (headcount). */
export const tripInterest = sqliteTable(
  "trip_interest",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    partySize: integer("party_size").notNull().default(1),
    note: text("note"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(now),
  },
  (t) => ({
    tripIdx: index("trip_interest_trip_idx").on(t.tripId),
    uniqueIdx: index("trip_interest_unique_idx").on(t.tripId, t.email),
  }),
);

/** Candidate dates/times for a trip (the poll options). */
export const tripPollOptions = sqliteTable(
  "trip_poll_options",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id").notNull(),
    label: text("label").notNull(), // e.g. "Sat Sep 19" or "Weekend of Oct 3"
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(now),
  },
  (t) => ({
    tripIdx: index("trip_poll_options_trip_idx").on(t.tripId),
  }),
);

/** Approval-style availability votes: one row per (voter, option) that works. */
export const tripPollVotes = sqliteTable(
  "trip_poll_votes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id").notNull(),
    optionId: integer("option_id").notNull(),
    voterEmail: text("voter_email").notNull(),
    voterName: text("voter_name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(now),
  },
  (t) => ({
    tripIdx: index("trip_poll_votes_trip_idx").on(t.tripId),
    uniqueIdx: index("trip_poll_votes_unique_idx").on(t.optionId, t.voterEmail),
  }),
);

// ==========================================================================
// Community (v4/v5): photo albums, board, trip comments, rate limiting
// ==========================================================================

/**
 * A photo album for a program (e.g. "2026 rides", "Dinner nights"). One album
 * per program can be flagged `main` (the default/featured album). No login
 * required to upload — see `src/app/community/actions.ts`.
 */
export const albums = sqliteTable(
  "albums",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    programId: integer("program_id"), // FK -> programs.id (convention-only)
    name: text("name").notNull(),
    main: integer("main", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(now),
  },
  (t) => ({
    programIdx: index("albums_program_idx").on(t.programId),
  }),
);

/** A single photo in an album, anonymously uploaded to R2. */
export const albumPhotos = sqliteTable(
  "album_photos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    albumId: integer("album_id").notNull(),
    takenDate: text("taken_date"), // ISO date, for date-grouped display
    imageKey: text("image_key").notNull(), // R2 object key (full size, for the viewer)
    thumbKey: text("thumb_key"), // R2 object key for the grid thumbnail (nullable → falls back to imageKey)
    caption: text("caption"),
    hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(now),
  },
  (t) => ({
    albumIdx: index("album_photos_album_idx").on(t.albumId),
  }),
);

/**
 * A community board post (title + optional body/name) for a program. `hidden`
 * soft-moderates; `voteScore` is maintained incrementally by `voteAction`.
 */
export const boardPosts = sqliteTable(
  "board_posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    programId: integer("program_id"), // FK -> programs.id (convention-only)
    title: text("title").notNull(),
    body: text("body"),
    authorName: text("author_name"),
    voteScore: integer("vote_score").notNull().default(0),
    hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(now),
  },
  (t) => ({
    programIdx: index("board_posts_program_idx").on(t.programId),
  }),
);

/** A comment on a board post. */
export const boardComments = sqliteTable(
  "board_comments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postId: integer("post_id").notNull(),
    authorName: text("author_name"),
    text: text("text").notNull(),
    hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(now),
  },
  (t) => ({
    postIdx: index("board_comments_post_idx").on(t.postId),
  }),
);

/**
 * One up/down vote per (post, voter). `voterKey` is a random value issued as
 * a long-lived cookie (see `voteAction`) — best-effort dedupe, not identity.
 */
export const boardVotes = sqliteTable(
  "board_votes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postId: integer("post_id").notNull(),
    voterKey: text("voter_key").notNull(),
    dir: integer("dir").notNull(), // +1 or -1
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(now),
  },
  (t) => ({
    postIdx: index("board_votes_post_idx").on(t.postId),
    uniqueIdx: index("board_votes_unique_idx").on(t.postId, t.voterKey),
  }),
);

/** "Trip talk" — a comment thread on a single trip. */
export const tripComments = sqliteTable(
  "trip_comments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    tripId: integer("trip_id").notNull(),
    authorName: text("author_name"),
    text: text("text").notNull(),
    hidden: integer("hidden", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(now),
  },
  (t) => ({
    tripIdx: index("trip_comments_trip_idx").on(t.tripId),
  }),
);

/**
 * A shared per-IP rate-limit ledger for every public community write (KTD4).
 * `bucket` = `"<action>:<hashedIp>"` — the IP is hashed before it ever reaches
 * this table (see `src/lib/ratelimit.ts`); a row is a single hit, counted
 * within a rolling window in app code (no TTL/expiry column — old rows are
 * pruned by a future cron job, tracked as a follow-up).
 */
export const rateHits = sqliteTable(
  "rate_hits",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    bucket: text("bucket").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(now),
  },
  (t) => ({
    bucketIdx: index("rate_hits_bucket_idx").on(t.bucket, t.createdAt),
  }),
);

// --- Types ---
export type Program = typeof programs.$inferSelect;
export type Dinner = typeof dinners.$inferSelect;
export type Ride = typeof rides.$inferSelect;
export type Rsvp = typeof rsvps.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;
export type IgPost = typeof igPosts.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type TripInterest = typeof tripInterest.$inferSelect;
export type TripPollOption = typeof tripPollOptions.$inferSelect;
export type TripPollVote = typeof tripPollVotes.$inferSelect;
export type Album = typeof albums.$inferSelect;
export type AlbumPhoto = typeof albumPhotos.$inferSelect;
export type BoardPost = typeof boardPosts.$inferSelect;
export type BoardComment = typeof boardComments.$inferSelect;
export type BoardVote = typeof boardVotes.$inferSelect;
export type TripComment = typeof tripComments.$inferSelect;
export type RateHit = typeof rateHits.$inferSelect;

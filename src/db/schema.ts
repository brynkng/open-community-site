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
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
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
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
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
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  },
  (t) => ({
    dateIdx: index("rides_date_idx").on(t.date),
  }),
);

/**
 * RSVPs for either a dinner or a ride. `kind` + `refId` point at the target.
 * No login required for attendees — name + email + party size.
 */
export const rsvps = sqliteTable(
  "rsvps",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ["dinner", "ride"] }).notNull(),
    refId: integer("ref_id").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    partySize: integer("party_size").notNull().default(1),
    note: text("note"),
    reminderSentAt: integer("reminder_sent_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  },
  (t) => ({
    targetIdx: index("rsvps_target_idx").on(t.kind, t.refId),
    // Prevent the same email double-booking one event (enforced in app + this index).
    uniqueIdx: index("rsvps_unique_idx").on(t.kind, t.refId, t.email),
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
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
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
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
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
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
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
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
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
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
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
    createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(now),
  },
  (t) => ({
    tripIdx: index("trip_poll_votes_trip_idx").on(t.tripId),
    uniqueIdx: index("trip_poll_votes_unique_idx").on(t.optionId, t.voterEmail),
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

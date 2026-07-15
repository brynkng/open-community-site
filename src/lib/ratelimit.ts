import { headers } from "next/headers";
import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { rateHits } from "@/db/schema";

/**
 * D1-backed per-IP rate limiter for public community writes (KTD4). Turnstile
 * is the primary bot defense (verified separately in every action); this is a
 * secondary cap so a single IP can't hammer a write in a short window.
 *
 * The IP (`CF-Connecting-IP`) is SHA-256 hashed before it ever touches the
 * `rate_hits` table or leaves this function — never stored or logged raw.
 *
 * Checking and recording happen atomically in one call: `checkRate(action)`
 * counts hits for `"<action>:<ipHash>"` within the rolling window, and if
 * under cap, records this call as a hit before returning `true`. Callers
 * should treat a `true` result as "this attempt has been counted" — call it
 * once per public write attempt, after Turnstile verification and before the
 * insert.
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 hour rolling window

/** Per-action caps (hits allowed per IP per rolling window). */
const CAPS: Record<string, number> = {
  upload: 10,
  createAlbum: 5,
  createPost: 15,
  comment: 30,
  vote: 60,
  tripComment: 30,
};
const DEFAULT_CAP = 20;

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * Returns `true` if `action` is allowed for the current request's IP (and
 * records the attempt), `false` if the per-action cap has been exceeded
 * within the rolling window (the caller should reject the write).
 */
export async function checkRate(action: string): Promise<boolean> {
  const cap = CAPS[action] ?? DEFAULT_CAP;
  const ip = (await headers()).get("cf-connecting-ip") || "unknown";
  const ipHash = await hashIp(ip);
  const bucket = `${action}:${ipHash}`;

  const db = getDb();
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(rateHits)
    .where(
      and(eq(rateHits.bucket, bucket), gte(rateHits.createdAt, windowStart)),
    );

  if ((row?.count ?? 0) >= cap) return false;

  await db.insert(rateHits).values({ bucket });
  return true;
}

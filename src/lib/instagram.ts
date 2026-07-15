import { env } from "./env";

const GRAPH = "https://graph.facebook.com/v21.0";
const TOKEN_KV_KEY = "ig_long_lived_token";

/**
 * Instagram publishing via the Graph API (Business/Creator account linked to a
 * Facebook Page). Because we publish to our OWN account, the Meta app can stay
 * in development mode with the account added as an admin/tester — no App Review.
 *
 * Publishing is a two-step "container" model:
 *   1) POST /{ig-user-id}/media          -> creation_id   (references a public image URL)
 *   2) POST /{ig-user-id}/media_publish  -> media_id       (goes live)
 */

/** Read the current long-lived token from KV, seeding from env on first run. */
export async function getToken(): Promise<string> {
  const stored = await env().IG_TOKENS.get(TOKEN_KV_KEY);
  if (stored) return stored;
  const seed = env().IG_SEED_LONG_LIVED_TOKEN;
  if (seed) {
    await env().IG_TOKENS.put(TOKEN_KV_KEY, seed);
    return seed;
  }
  throw new Error("No Instagram token available (set IG_SEED_LONG_LIVED_TOKEN).");
}

/**
 * Extend the long-lived token for another ~60 days and store it in KV.
 * Called by the daily cron. Uses the Facebook token-exchange grant.
 */
export async function refreshToken(): Promise<void> {
  const current = await getToken();
  const url =
    `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token` +
    `&client_id=${encodeURIComponent(env().IG_APP_ID)}` +
    `&client_secret=${encodeURIComponent(env().IG_APP_SECRET)}` +
    `&fb_exchange_token=${encodeURIComponent(current)}`;
  const res = await fetch(url);
  const data = (await res.json()) as { access_token?: string; error?: unknown };
  if (!res.ok || !data.access_token) {
    throw new Error(`IG token refresh failed: ${JSON.stringify(data)}`);
  }
  await env().IG_TOKENS.put(TOKEN_KV_KEY, data.access_token);
}

/** Upload image bytes to R2 and return the PUBLIC url the IG API can fetch. */
export async function uploadImageToR2(
  key: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<string> {
  await env().MEDIA.put(key, bytes, { httpMetadata: { contentType } });
  const base = env().R2_PUBLIC_BASE_URL.replace(/\/$/, "");
  return `${base}/${key}`;
}

/** Publish a single image + caption. Returns the IG media id. */
export async function publishImage(imageUrl: string, caption: string): Promise<string> {
  const token = await getToken();
  const igUserId = env().IG_USER_ID;

  // Step 1: create media container
  const createRes = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: token }),
  });
  const create = (await createRes.json()) as { id?: string; error?: unknown };
  if (!createRes.ok || !create.id) {
    throw new Error(`IG container create failed: ${JSON.stringify(create)}`);
  }

  // Step 2: publish the container
  const pubRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: create.id, access_token: token }),
  });
  const pub = (await pubRes.json()) as { id?: string; error?: unknown };
  if (!pubRes.ok || !pub.id) {
    throw new Error(`IG media_publish failed: ${JSON.stringify(pub)}`);
  }
  return pub.id;
}

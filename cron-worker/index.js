/**
 * Tiny companion Worker (free tier) that fires the main site's cron routes.
 * Cloudflare Cron Triggers call the scheduled() handler below on the schedule
 * defined in wrangler.jsonc. Deploy from this folder: `wrangler deploy`.
 */
export default {
  async scheduled(event, env, ctx) {
    const base = env.SITE_URL.replace(/\/$/, "");
    const key = env.CRON_SECRET;

    // The 08:10 trigger refreshes the token; the 08:15 trigger sends reminders.
    // Simplest: hit both on every run — they're idempotent.
    const jobs = [
      `${base}/api/cron/refresh-ig-token?key=${encodeURIComponent(key)}`,
      `${base}/api/cron/ride-reminders?key=${encodeURIComponent(key)}`,
      `${base}/api/cron/generate-events?key=${encodeURIComponent(key)}`,
    ];

    ctx.waitUntil(
      Promise.all(
        jobs.map((url) =>
          fetch(url, { method: "GET" }).catch((e) =>
            console.error("cron fetch failed", url, e),
          ),
        ),
      ),
    );
  },
};

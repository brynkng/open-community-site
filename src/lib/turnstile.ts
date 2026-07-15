import { env } from "./env";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verifies a Cloudflare Turnstile token server-side before accepting a public
 * write (RSVPs). Returns `false` on a missing token or any non-success
 * response — there is no fail-open path, so a Turnstile outage blocks writes
 * rather than silently allowing bots through.
 *
 * Requires `TURNSTILE_SECRET_KEY` (set via `npx wrangler secret put
 * TURNSTILE_SECRET_KEY`; the widget + site key are provisioned separately in
 * the Cloudflare Turnstile dashboard, or via the project's `turnstile-spin`
 * skill — not done here).
 */
export async function verifyTurnstile(
  token: string | null,
  ip?: string,
): Promise<boolean> {
  if (!token) return false;

  const body = new URLSearchParams({
    secret: env().TURNSTILE_SECRET_KEY,
    response: token,
  });
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

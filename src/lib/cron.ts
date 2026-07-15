import { env } from "./env";

/** Verify the caller presented the shared cron secret (header or query). */
export function authorizeCron(req: Request): boolean {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("key");
  const fromHeader = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const secret = env().CRON_SECRET;
  return Boolean(secret) && (fromQuery === secret || fromHeader === secret);
}

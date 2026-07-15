import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

/**
 * Returns a Drizzle client bound to the D1 database for the current request.
 * Works in `next dev` (via initOpenNextCloudflareForDev in next.config.ts) and
 * in production on Cloudflare Workers.
 */
export function getDb() {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}

export { schema };

import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Typed accessor for bindings + secrets. */
export function env(): CloudflareEnv {
  return getCloudflareContext().env;
}

import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Default incremental cache is fine for this app. R2/KV caching can be added later.
});

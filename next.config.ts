import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow serving Instagram-bound images from R2's public bucket URL.
    remotePatterns: [
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.cloudflarestorage.com" },
    ],
  },
};

export default nextConfig;

// Enables getCloudflareContext() during `next dev` so D1/R2 bindings work locally.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();

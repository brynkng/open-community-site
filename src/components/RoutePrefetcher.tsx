"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Once any page is interactive, warm the other top-level routes during idle
 * time so cross-brand navigation feels instant. `router.prefetch()` fetches
 * the full RSC payload (unlike in-viewport <Link> prefetch, which only warms
 * the loading boundary for these dynamic, D1-backed routes). Skips the route
 * you're already on, and no-ops on the server / when idle callbacks are unused.
 */
export function RoutePrefetcher({ routes }: { routes: string[] }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const targets = routes.filter((r) => r !== pathname);
    const idle: (cb: () => void) => number =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? (cb) => window.requestIdleCallback(cb, { timeout: 2000 })
        : (cb) => window.setTimeout(cb, 200);

    const handle = idle(() => {
      for (const r of targets) router.prefetch(r);
    });

    return () => {
      if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(handle);
      } else {
        clearTimeout(handle);
      }
    };
  }, [router, pathname, routes]);

  return null;
}

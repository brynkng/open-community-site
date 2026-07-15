---
title: router.prefetch() warms dynamic routes fully — in-viewport <Link> prefetch only warms the loading boundary
type: gotcha
area: nextjs
tags:
  [
    next15,
    app-router,
    prefetch,
    rsc,
    dynamic-routes,
    performance,
    client-components,
  ]
status: current
created: 2026-07-15
source_files:
  - src/components/RoutePrefetcher.tsx
  - src/app/layout.tsx
---

# router.prefetch() warms dynamic routes; default <Link> prefetch doesn't

## The gotcha

In the Next.js App Router, default in-viewport `<Link>` prefetch (`prefetch` unset)
warms only the **loading boundary** (`loading.tsx` / the nearest Suspense fallback)
for **dynamic** routes — routes that render on demand rather than being statically
prerendered. It does **not** fetch the full RSC payload. So the click still pays for
the server render.

Our top routes (`/`, `/dinner`, `/rides`, `/trips`) are D1-backed and marked
`export const dynamic = "force-dynamic"` (see [[coding-conventions]] — D1 is
per-request, no static caching). That is exactly the case where `<Link>` prefetch
under-delivers.

To eagerly warm the **complete** RSC payload for a dynamic route, call
`router.prefetch(href)` explicitly (from `useRouter()` in a client component).

## How we used it

`src/components/RoutePrefetcher.tsx` is a client component mounted once in
`src/app/layout.tsx` (right after `<BrandNav>`) with
`routes={["/", "/dinner", "/rides", "/trips"]}`. On mount it:

1. filters out the current `usePathname()` (don't prefetch the page you're on),
2. schedules the work via `requestIdleCallback` (fallback `setTimeout`) so it never
   competes with the initial interactive render,
3. calls `router.prefetch(r)` for each remaining top route,
4. cleans up with `cancelIdleCallback` / `clearTimeout` on unmount.

Net effect: once any page is interactive, cross-brand navigation to the other top
routes feels instant because their full payloads are already warm.

## Watch out

- **Production-only behavior.** Prefetching does **not** fire in `next dev` — you
  cannot verify it via the network panel locally. Confirm on a production/preview
  build, or trust the mechanism and check perceived nav speed after deploy.
- **Prefetch base routes only.** We intentionally skipped the `?program=slug`
  query-param variants. Base routes are the win; prefetching every program
  permutation would be wasteful (N fetches for marginal benefit).
- Guard for SSR — `requestIdleCallback`/`window` don't exist on the server; the
  component no-ops there and only does real work in the effect (client-side).

See [[app-architecture-and-integrations]] and [[coding-conventions]].

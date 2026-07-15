---
title: Hide the Turnstile widget with appearance "interaction-only" — token still arrives
type: pattern
area: cloudflare-nextjs
tags: [turnstile, cloudflare, client-components, ux, forms]
status: current
created: 2026-07-15
source_files:
  - src/components/TurnstileWidget.tsx
---

# Turnstile: use appearance "interaction-only" to hide the widget without losing the token

## The nugget

Cloudflare Turnstile's default `appearance` ("always") renders a visible "Success!" /
Cloudflare-logo box inline in the form even when the visitor silently passes the managed check.
That box is intrusive on small mobile forms.

Pass `appearance: "interaction-only"` to `window.turnstile.render(...)` to keep the widget
**invisible on the common managed-pass path** — it renders nothing — while it still runs the check
and **still fires the `callback` with a verification token**. The widget only becomes visible when
Cloudflare actually requires an interactive challenge.

```ts
window.turnstile.render(containerRef.current, {
  sitekey: siteKey,
  callback: handleToken, // token still arrives here on the silent pass
  "expired-callback": handleExpireOrError,
  "error-callback": handleExpireOrError,
  appearance: "interaction-only",
});
```

## Why it's safe here

Our token-gated submit buttons use `disabled={!token}`, and the token is captured from the
`callback` (and mirrored into a hidden `cf-turnstile-response` input for `FormData`). Because
`interaction-only` still delivers the token via `callback`, gated buttons enable normally — the
change is purely cosmetic on the success path. This is the shared `TurnstileWidget`, so it applies
everywhere it's used: album create/upload, RSVP, trip comments, and board forms.

## Type note

`window.turnstile.render`'s options type is hand-declared in `TurnstileWidget.tsx`
(`declare global`). When adding a Turnstile option, extend that inline type too — e.g. this change
added `appearance?: "always" | "execute" | "interaction-only"` and
`size?: "normal" | "flexible" | "compact"`.

## Related

- [[next-public-env-is-build-time-not-wrangler-runtime]] — the other Turnstile gotcha in this
  codebase: the `NEXT_PUBLIC_TURNSTILE_SITE_KEY` must be in `.env.production` (build-time), not a
  `wrangler.jsonc` runtime var, or the widget never loads at all.

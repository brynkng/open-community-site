---
title: A video-background's poster fallback must be an always-rendered CSS element, not a JS-gated <img> or <video poster>
type: bug
area: frontend
tags:
  [
    hydration,
    video-background,
    poster,
    dinner,
    css-media-query,
    ssr,
    first-paint,
    client-components,
  ]
status: current
created: 2026-07-15
source_files:
  - src/components/DinnerBackground.tsx
  - src/components/DinnerPanel.tsx
  - src/app/globals.css
---

# A video-background poster must be CSS-driven, not JS/attribute-gated

## The bug

The `/dinner` hero (`DinnerBackground.tsx`) rendered a **black/empty background** on mobile
instead of the looping dinner video or its poster still. The homepage's dinner section
(`DinnerPanel.tsx`) rendered fine — same video, no black.

Root cause: `DinnerBackground` gated its **entire** visual render behind a JS-resolved state
variable `src`:

```jsx
{reduceMotion ? <img…> : !src ? null : <video…>}
```

`src` is only assigned inside a `useEffect` (a viewport `matchMedia` pick between the portrait
and landscape clips). Until React hydrated and that effect ran, the component rendered **nothing**
but a black `bg-ink` div. And the only poster was the `<video>`'s `poster=` attribute — which
doesn't exist until the `<video>` element itself mounts. So before hydration/video-paint there was
**no fallback image at all** → black hero. This is worst on mobile, where hydration is slowest and
least reliable.

## The rule

**A video background's poster fallback must be an always-rendered, CSS-driven element** — a `div`
with a `background-image` selected by media query, layered UNDER the video — **not** the
`<video poster=…>` attribute and **not** a JS-gated `<img>`. Both of the latter disappear whenever
hydration is slow or absent, and the `<video poster>` attribute additionally can't switch stills
per breakpoint.

This also fixes the sibling problem (from commit `3552eaa`): a CSS media query picks the correct
still from **first paint**, so desktop never flashes the mobile poster.

## The fix (commit `929fbbf`)

`DinnerBackground.tsx` — always render the poster; layer the video on top only once JS resolves the
source:

```jsx
<div className="ds-dinner-hero-poster absolute inset-0" />
{!reduceMotion && src && <video … className="… absolute inset-0" />}
```

The JS `poster` state and the `!src ? null` black-gate were removed.

`globals.css` — the poster is a real element with a per-viewport `background-image`:

```css
.ds-dinner-hero-poster {
  background: #… url(<portrait still>) center bottom / cover no-repeat; /* mobile */
}
@media (min-width: 640px) {
  .ds-dinner-hero-poster {
    background-image: url(<landscape still>);
    background-position: center;
  }
}
```

Mobile anchors the still `center bottom` (favoring the dinner scene, keeping the busy logo badge out
from under the high hero copy); desktop centers the landscape still.

## Where this pattern already lived

`DinnerPanel.tsx` never had the bug because commit `3552eaa` had already given it an always-present,
CSS-media-query-driven poster (`.ds-dinner-poster`) layered under the video. `DinnerBackground` was
simply never brought up to the same pattern. **When two components render the same video background,
they must share the CSS-poster approach** — don't leave one on a JS-gated fallback.

## Testing caveat

The connected test browser does **not** fire client effects, so the `<video>` layer can't be
observed there — but that's exactly the pre-hydration state this fix targets, and it now paints the
correctly-framed poster immediately (`background-position: 50% 100%` on mobile). Video layering is
verified transitively: it uses the identical proven pattern as `DinnerPanel`, which works on real
devices.

## Related

- [[design-prototype-porting]] — same files (`DinnerPanel`, `globals.css`); reinforces the general
rule that **breakpoint-dependent values belong in CSS classes with a `@media` block, not inline
styles or JS**. This poster fix is that rule applied to the fallback still.
</content>

</invoke>

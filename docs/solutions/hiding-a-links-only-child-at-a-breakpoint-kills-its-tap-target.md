---
title: Hiding a link's only child at a breakpoint silently kills the link's tap target
type: bug
area: frontend
tags:
  [
    responsive,
    css-media-query,
    navigation,
    accessibility,
    tap-target,
    mobile,
    display-none,
  ]
status: current
created: 2026-07-15
source_files:
  - src/components/BrandNav.tsx
  - src/app/globals.css
---

# Hiding a link's only child at a breakpoint kills the link's tap target

## The bug

On mobile there was **no way back to the homepage** — the nav's home link had zero tappable
area. The home `<Link href="/">` in `BrandNav.tsx` wrapped **only** the "Sidewalk Story"
wordmark:

```jsx
<Link href="/">
  <span className="ds-brand-word">Sidewalk Story</span>
</Link>
```

To buy horizontal room for the nav links, a `@media (max-width: 640px)` rule in `globals.css`
hid the wordmark:

```css
@media (max-width: 640px) {
  .ds-brand-word {
    display: none;
  }
}
```

`display: none` on a link's **only** child collapses the link to zero width/height. The link
still exists in the DOM, but there is nothing to tap — the homepage became unreachable on
mobile, with no visible symptom (no error, no empty box).

## The rule

**If a link/button wraps only content you hide at a breakpoint, always give it a visible
fallback element inside the same link** — usually a compact icon that shows exactly where the
text is hidden. A link with no rendered child has no tap target, even though it's still in the
DOM. This is easy to miss because the desktop layout looks and works fine.

## The fix (commit `8add52a`)

Add a house-icon span inside the same link, inverse-gated to the wordmark: hidden by default,
shown only where the wordmark is hidden. Keep an accessible label so the icon-only state still
announces its destination.

```jsx
<Link href="/">
  <span className="ds-brand-word">Sidewalk Story</span>
  <span className="ds-brand-home" aria-hidden="true">
    {/* house SVG */}
  </span>
  <span className="ds-visually-hidden">Sidewalk Story home</span>
</Link>
```

```css
.ds-brand-home {
  display: none;
}
@media (max-width: 640px) {
  .ds-brand-word {
    display: none;
  }
  .ds-brand-home {
    display: inline-flex;
  } /* fallback appears exactly when text disappears */
}
```

A reusable `.ds-visually-hidden` utility was added for the off-screen label (the icon is
`aria-hidden`, so the label carries the link's accessible name).

## Related

- [[design-prototype-porting]] and [[video-background-poster-must-be-css-driven]] — same
breakpoint discipline: values that change at a breakpoint belong in CSS classes with a
`@media` block. This is the tap-target corollary: when a `@media` rule hides an element,
check whether it was some interactive ancestor's only child.
</content>

</invoke>

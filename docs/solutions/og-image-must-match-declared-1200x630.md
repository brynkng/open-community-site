---
title: A default OG image must physically be 1200×630 — extend a logo onto its own sampled background, don't point metadata at a raw square asset
type: gotcha
area: frontend
tags: [seo, opengraph, og-image, social-preview, metadata, imagemagick, assets]
status: current
created: 2026-07-15
source_files:
  - src/lib/seo.ts
  - public/brands/sidewalk-story-og.png
---

# A default OG image must physically be 1200×630, not a cropped square logo

## The gotcha

`pageMetadata()` in `src/lib/seo.ts` declares `width: 1200, height: 630` for every OG/Twitter
card. Those numbers are just metadata hints — they do **not** resize the file. Social platforms
(Slack, iMessage, Facebook, X) render the card at roughly a 1.91:1 ratio and **center-crop**
whatever image you give them.

So pointing `OG_IMAGE_DEFAULT` at the raw logo (`/brands/sidewalk-story.png`, a ~square 1536×1024
circular badge) looks fine locally but ships a card that crops the top and bottom off the badge.
The declared `1200×630` makes it _worse_ by asserting a ratio the asset doesn't have.

## The rule

The default OG image must be a **purpose-built asset at the exact declared ratio (1200×630)**. When
the source art is a logo/badge with a solid background, don't crop it — **pad it onto more of its
own background color** so the framing is seamless:

```bash
# Sample the logo's own background color first (don't eyeball a hex).
# Here #968F7E was sampled from the PNG's corner.
magick public/brands/sidewalk-story.png \
  -resize 560x560 \
  -background '#968F7E' -gravity center -extent 1200x630 \
  public/brands/sidewalk-story-og.png
```

`-extent 1200x630` with `-gravity center` centers the shrunk logo on a 1200×630 canvas; the
`-background` fills the new space. Because the fill color _is_ the logo's background, the padding is
invisible — the card reads as one continuous badge, not a logo on a mismatched block.

Then set the default to the generated card:

```ts
export const OG_IMAGE_DEFAULT = "/brands/sidewalk-story-og.png";
```

## Scope note

This changed **only** the default. The per-kind map `OG_IMAGE_BY_KIND` (dinner/ride/trip event
photos) is separate and stays on its landscape event photos — those are already ~1200×630-shaped.
`seo.ts` still carries a TODO to replace those interim stand-ins with purpose-built `/og/*.jpg` art;
the same "generate at the declared ratio" rule applies when that happens.

## Related

- `src/lib/seo.ts` — single `pageMetadata()` factory where the `1200×630` dimensions and the
  OG-image constants live; keep the declared dimensions and the actual asset ratio in sync.

"use client";

import { useEffect, useState } from "react";

// Mobile uses the portrait clip; desktop uses the landscape clip imported
// alongside it (resolves the former "desktop reuses the mobile clip" follow-up).
const MOBILE_SRC = "/media/dinner-mobile.mp4";
const DESKTOP_SRC = "/media/dinner-bg.mp4";
// Posters are CSS-driven (.ds-dinner-hero-poster in globals.css) so the correct
// still shows per-viewport from first paint — no JS/SSR mobile-on-desktop flash,
// and no black hero before the video paints (the former `!src ? null` gate left
// the hero fully black until hydration set the src, which never reliably
// happened on mobile).

/**
 * Full-bleed background for the dinner hero: a correctly-framed poster still
 * (CSS-driven, visible from first paint) with a muted, looping, autoplaying
 * video layered on top, chosen by viewport (portrait on mobile, landscape on
 * desktop). Honors prefers-reduced-motion by showing only the poster still.
 */
export function DinnerBackground() {
  const [src, setSrc] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(reduce.matches);

    const wide = window.matchMedia("(min-width: 640px)");
    const pick = () => setSrc(wide.matches ? DESKTOP_SRC : MOBILE_SRC);
    pick();
    wide.addEventListener("change", pick);
    return () => wide.removeEventListener("change", pick);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-ink">
      {/* Poster still, chosen per-viewport in CSS; visible until the video
          paints (and permanently under reduced motion). On mobile the portrait
          media stacks a light, busy logo badge on top of the warm dinner scene
          and the hero copy sits high, so both poster and video favor the lower
          scene (object-bottom) to keep the badge out from under the text.
          Desktop uses the landscape clip centered. */}
      <div className="ds-dinner-hero-poster absolute inset-0" />
      {!reduceMotion && src && (
        <video
          key={src}
          className="absolute inset-0 h-full w-full object-cover object-bottom sm:object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          src={src}
        />
      )}
      {/* Legibility overlay. Mobile: stronger and top-weighted because the
          headline + copy sit high over a bright kitchen scene. Desktop: lighter,
          bottom-weighted for the centered landscape clip. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/75 sm:from-black/30 sm:via-black/40 sm:to-black/70" />
    </div>
  );
}

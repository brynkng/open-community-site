"use client";

import { useEffect, useState } from "react";

// Mobile uses the portrait clip; desktop uses the landscape clip imported
// alongside it (resolves the former "desktop reuses the mobile clip" follow-up).
const MOBILE_SRC = "/media/dinner-mobile.mp4";
const DESKTOP_SRC = "/media/dinner-bg.mp4";
const POSTER = "/media/dinner-poster.jpg";

/**
 * Full-bleed background for the dinner hero: a muted, looping, autoplaying video
 * chosen by viewport (portrait on mobile, landscape on desktop). Honors
 * prefers-reduced-motion by showing the poster still instead of the video.
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
      {reduceMotion || !src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={POSTER} alt="" className="h-full w-full object-cover" />
      ) : (
        <video
          key={src}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={POSTER}
          src={src}
        />
      )}
      {/* Legibility overlay: darker at the bottom where the text sits. */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BrandTokens } from "@/lib/brands";
import { Reveal } from "@/components/Reveal";

const MOBILE_SRC = "/media/dinner-mobile.mp4";
const DESKTOP_SRC = "/media/dinner-bg.mp4";
const MOBILE_POSTER = "/media/dinner-poster-mobile.jpg";
const DESKTOP_POSTER = "/media/dinner-poster-desktop.jpg";

/**
 * Video-forward landing panel for the dinner brand (Sidewalk Story). Ports the
 * design prototype's "split-band" `DinnerPanel` layout: a warm-cream → brick-red
 * → navy vertical gradient backs the panel, the looping video is nudged ~17% to
 * the right, and a left-anchored dark scrim keeps a single left column of copy
 * (eyebrow, headline, sub, CTA) legible over it. Viewport-selects portrait
 * (mobile) vs. landscape (desktop) source, same pattern as `DinnerBackground.tsx`,
 * and shows the poster still under reduced motion. The prototype's global tokens
 * (`--ss-bg`, `--ss-red-deep`) map onto the app's `[data-brand="ss"]`-scoped
 * `--brand-*` vars; the navy stop (`--nb-navy`) isn't in that scope, so it's the
 * literal hex.
 */
export function DinnerPanel({
  brand,
  href,
  when,
  headline,
  sub,
  cta,
}: {
  brand: BrandTokens;
  href: string;
  when: string;
  headline: string;
  sub: string;
  cta: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [poster, setPoster] = useState(MOBILE_POSTER);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(reduce.matches);

    const wide = window.matchMedia("(min-width: 640px)");
    const pick = () => {
      setSrc(wide.matches ? DESKTOP_SRC : MOBILE_SRC);
      setPoster(wide.matches ? DESKTOP_POSTER : MOBILE_POSTER);
    };
    pick();
    wide.addEventListener("change", pick);
    return () => wide.removeEventListener("change", pick);
  }, []);

  return (
    <Link
      href={href}
      data-brand={brand.brandKey}
      className="ds-land-panel block"
      style={{
        background: "#000",
        padding: 0,
        justifyContent: "flex-end",
      }}
    >
      {/* Cap the video background at 1300px, centered, with black pillar bars
          on the sides of wider viewports (the panel's black background). */}
      <div className="relative mx-auto flex w-full max-w-[1300px] flex-1 flex-col justify-end overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {reduceMotion || !src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt=""
              className="ds-dinner-video h-full w-full object-cover"
            />
          ) : (
            <video
              key={src}
              className="ds-dinner-video h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={poster}
              src={src}
            />
          )}
        </div>

        {/* scrim so the copy reads over the video — left-anchored on desktop,
          bottom-weighted on mobile (see .ds-dinner-scrim in globals.css) */}
        <div aria-hidden className="ds-dinner-scrim absolute inset-0" />

        <Reveal
          style={{
            position: "relative",
            width: "100%",
            padding: "clamp(26px, 4vw, 46px)",
          }}
        >
          <div
            className="ds-dinner-copy"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                color: "#fff",
                opacity: 0.95,
                letterSpacing: ".09em",
                textTransform: "uppercase",
                textShadow: "0 2px 12px #000, 0 0 8px #000, 0 0 3px #000",
              }}
            >
              {brand.name} · {when}
            </span>
            <h2
              style={{
                fontFamily: brand.displayFontVar,
                fontSize: "clamp(20px, 2.7vw, 34px)",
                color: "#fff",
                margin: 0,
                lineHeight: 1.3,
                textShadow:
                  "0 2px 20px #000, 0 2px 8px #000, 0 0 6px #000, 0 0 2px #000",
              }}
            >
              {headline}
            </h2>
            <p
              style={{
                fontSize: "clamp(14px, 1.5vw, 17px)",
                margin: 0,
                color: "#fff",
                lineHeight: 1.55,
                textShadow:
                  "0 2px 16px #000, 0 1px 6px #000, 0 0 5px #000, 0 0 2px #000",
              }}
            >
              {sub}
            </p>
            <span
              className="ds-btn"
              style={{
                background: "rgba(255,255,255,.96)",
                color: "var(--brand-accent-deep)",
                marginTop: 4,
              }}
            >
              {cta} →
            </span>
          </div>
        </Reveal>
      </div>
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Program } from "@/db/schema";
import type { BrandTokens } from "@/lib/brands";
import { Reveal } from "@/components/Reveal";

const MOBILE_SRC = "/media/dinner-mobile.mp4";
const DESKTOP_SRC = "/media/dinner-bg.mp4";
const POSTER = "/media/dinner-poster.jpg";

/**
 * Video-forward landing panel for the dinner brand (Sidewalk Story). Ports
 * the design prototype's "lower-band" `DinnerPanel` layout: video fills the
 * panel, copy sits in a frosted bar pinned to the bottom. Viewport-selects
 * portrait (mobile) vs. landscape (desktop) source, same pattern as
 * `DinnerBackground.tsx`, and shows the poster still under reduced motion.
 */
export function DinnerPanel({
  program,
  brand,
  href,
  when,
  headline,
  sub,
  cta,
}: {
  program: Program;
  brand: BrandTokens;
  href: string;
  when: string;
  headline: string;
  sub: string;
  cta: string;
}) {
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
    <Link
      href={href}
      data-brand={brand.brandKey}
      className="ds-land-panel block"
      style={{ background: "#1a0f0c", padding: 0, justifyContent: "flex-end" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
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
      </div>

      <Reveal
        style={{
          position: "relative",
          width: "100%",
          padding: "clamp(22px, 4vw, 40px)",
          background:
            "linear-gradient(180deg, transparent, rgba(20,12,9,.5) 30%, rgba(20,12,9,.82))",
          backdropFilter: "blur(2px)",
        }}
      >
        <div style={{ maxWidth: 640 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
            }}
          >
            {program.logoUrl && (
              <Image
                src={program.logoUrl}
                alt={`${brand.name} logo`}
                width={54}
                height={54}
                className="ds-float-slow"
                style={{
                  borderRadius: "50%",
                  objectFit: "cover",
                  boxShadow: "0 4px 14px rgba(0,0,0,.3)",
                }}
              />
            )}
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 800,
                  fontSize: 15,
                  letterSpacing: ".02em",
                  color: "#fff",
                }}
              >
                {brand.name}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  opacity: 0.85,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: "#fff",
                }}
              >
                {when}
              </p>
            </div>
          </div>
          <h2
            style={{
              fontFamily: brand.displayFontVar,
              fontSize: "clamp(26px, 4vw, 46px)",
              color: "#fff",
              textShadow: "0 2px 18px rgba(0,0,0,.35)",
              margin: 0,
            }}
          >
            {headline}
          </h2>
          <p
            style={{
              fontSize: "clamp(15px, 1.6vw, 18px)",
              opacity: 0.95,
              maxWidth: 520,
              margin: "12px 0 20px",
              color: "#fff",
            }}
          >
            {sub}
          </p>
          <span
            className="ds-btn"
            style={{ background: "rgba(255,255,255,.96)", color: brand.accent }}
          >
            {cta} →
          </span>
        </div>
      </Reveal>
    </Link>
  );
}

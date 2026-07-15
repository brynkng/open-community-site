import Image from "next/image";
import Link from "next/link";
import type { Program } from "@/db/schema";
import type { BrandTokens } from "@/lib/brands";
import { Photo, type PhotoData } from "@/components/Photo";
import { Reveal } from "@/components/Reveal";

/** Drifting photo tile positions, ported from the design prototype's `DRIFT_SPOTS`. */
const DRIFT_SPOTS = [
  { top: "6%", right: "4%", width: "min(26vw, 300px)", tilt: "-3deg", amp: 1 },
  {
    top: "30%",
    right: "22%",
    width: "min(19vw, 210px)",
    tilt: "2.5deg",
    amp: 1.6,
  },
  {
    top: "10%",
    right: "34%",
    width: "min(14vw, 150px)",
    tilt: "-1.5deg",
    amp: 2.2,
  },
] as const;

export function LandingPanel({
  program,
  brand,
  href,
  when,
  headline,
  sub,
  cta,
  panelBg,
  photos,
}: {
  program: Program;
  brand: BrandTokens;
  href: string;
  /** Cadence line under the brand name, e.g. "Every Sunday · 10 AM" or a computed next-event date. */
  when: string;
  headline: string;
  sub: string;
  cta: string;
  panelBg: string;
  photos: PhotoData[];
}) {
  return (
    <Link
      href={href}
      data-brand={brand.brandKey}
      className="ds-land-panel block"
      style={{ background: panelBg }}
    >
      {/* drifting photos */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {DRIFT_SPOTS.map((s, i) =>
          photos[i] ? (
            <div
              key={i}
              className="ds-drift"
              style={
                {
                  top: s.top,
                  right: s.right,
                  width: s.width,
                  "--tilt": s.tilt,
                  "--drift-amp": s.amp,
                  animationDelay: `${i * -4}s`,
                  opacity: 0.9,
                } as React.CSSProperties
              }
            >
              <Photo photo={photos[i]} style={{ borderRadius: 0 }} />
            </div>
          ) : null,
        )}
        {/* soft vignette so text reads */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.42) 100%)",
          }}
        />
      </div>

      <Reveal style={{ position: "relative", maxWidth: 640 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
          }}
        >
          {program.logoUrl ? (
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
          ) : (
            <span
              className="ds-float-slow"
              aria-hidden
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                background: brand.accent,
                display: "grid",
                placeItems: "center",
                fontSize: 24,
                boxShadow: "0 4px 14px rgba(0,0,0,.3)",
              }}
            >
              {brand.emojiFallback ?? brand.name.slice(0, 1)}
            </span>
          )}
          <div>
            <p
              style={{
                margin: 0,
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: ".02em",
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
              }}
            >
              {when}
            </p>
          </div>
        </div>
        <h2
          style={{
            fontFamily: brand.displayFontVar,
            fontSize: "clamp(28px, 5vw, 52px)",
            textShadow: "0 2px 18px rgba(0,0,0,.3)",
            margin: 0,
          }}
        >
          {headline}
        </h2>
        <p
          style={{
            fontSize: "clamp(15px, 1.6vw, 18px)",
            opacity: 0.92,
            maxWidth: 520,
            margin: "12px 0 20px",
          }}
        >
          {sub}
        </p>
        <span
          className="ds-btn"
          style={{ background: "rgba(255,255,255,.95)", color: brand.accent }}
        >
          {cta} →
        </span>
      </Reveal>
    </Link>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Program } from "@/db/schema";
import { brandForProgram, type BrandKey } from "@/lib/brands";

/** Which brand (if any) the current route belongs to, driving the nav's logo/color swap. */
function activeBrandKey(pathname: string): BrandKey | null {
  if (pathname.startsWith("/dinner")) return "ss";
  if (pathname.startsWith("/rides")) return "nb";
  if (pathname.startsWith("/trips")) return "ft";
  return null;
}

function programHref(p: Program): string {
  if (p.kind === "dinner") return `/dinner?program=${p.slug}`;
  if (p.kind === "ride") return `/rides?program=${p.slug}`;
  return `/trips?program=${p.slug}`;
}

const STATIC_LINKS: {
  href: string;
  label: string;
  match: (p: string) => boolean;
}[] = [
  { href: "/dinner", label: "Dinners", match: (p) => p.startsWith("/dinner") },
  { href: "/rides", label: "Rides", match: (p) => p.startsWith("/rides") },
  { href: "/trips", label: "Trips", match: (p) => p.startsWith("/trips") },
];

/**
 * Brand-aware sticky top nav. Swaps the logo mark to match the active brand
 * (by route) and highlights the matching nav link. Falls back to static
 * `/dinner`/`/rides`/`/trips` links (mirroring the existing `safePrograms()`
 * fail-safe in layout.tsx) when no program rows are available.
 */
export function BrandNav({ programs }: { programs: Program[] }) {
  const pathname = usePathname();
  const activeBrand = activeBrandKey(pathname);
  const activeProgram = programs.find(
    (p) => brandForProgram(p).brandKey === activeBrand,
  );
  const brand = activeProgram ? brandForProgram(activeProgram) : null;

  return (
    <header
      className="ds-topnav"
      data-brand={activeBrand ?? undefined}
      style={{ paddingTop: "calc(10px + env(safe-area-inset-top))" }}
    >
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "inherit",
          textDecoration: "none",
          fontWeight: 800,
        }}
      >
        {activeBrand === "ss" ? (
          <Image
            src="/brands/sidewalk-story.png"
            alt="Sidewalk Story logo"
            width={34}
            height={34}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        ) : activeBrand === "nb" ? (
          <Image
            src="/brands/nomadic-bike-philly.jpg"
            alt="Nomad Bike Philly logo"
            width={34}
            height={34}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
        ) : activeBrand === "ft" ? (
          <span
            aria-hidden
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: brand?.accent ?? "var(--ds-ink)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 15,
            }}
          >
            ⛺
          </span>
        ) : (
          <span
            aria-hidden
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "var(--ds-ink)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 14,
            }}
          >
            S
          </span>
        )}
        <span className="ds-brand-word" style={{ fontSize: 15 }}>
          {brand?.name ?? "Sidewalk Story"}
        </span>
      </Link>

      <div className="ds-nav-links">
        {programs.length > 0
          ? programs.map((p) => (
              <Link
                key={p.id}
                href={programHref(p)}
                className={`ds-nav-link${brandForProgram(p).brandKey === activeBrand ? " active" : ""}`}
              >
                {p.name}
              </Link>
            ))
          : STATIC_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`ds-nav-link${l.match(pathname) ? " active" : ""}`}
              >
                {l.label}
              </Link>
            ))}
        <Link href="/#newsletter" className="ds-nav-link">
          Newsletter
        </Link>
      </div>
    </header>
  );
}

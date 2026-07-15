import type { Metadata } from "next";
import { env } from "@/lib/env";
import type { Program } from "@/db/schema";

/** Hardcoded fallback origin — see KTD1. Must match wrangler.jsonc's NEXT_PUBLIC_SITE_URL. */
export const SITE_URL_FALLBACK = "https://sidewalkstoryphilly.com";

const SITE_NAME = "Sidewalk Story";

/**
 * Canonical origin, no trailing slash. Reads the wrangler var at request time
 * via env(); env() calls getCloudflareContext(), which can throw when there is
 * no active Cloudflare request context (e.g. some build-time static analysis
 * passes). This function must NEVER throw — everything downstream (sitemap,
 * robots, generateMetadata) depends on that.
 */
export function siteUrl(): string {
  try {
    return env().NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? SITE_URL_FALLBACK;
  } catch {
    return SITE_URL_FALLBACK;
  }
}

/** Join the site origin with a path, ensuring exactly one slash between them. */
export function absoluteUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${cleanPath}`;
}

/**
 * Per-kind OG image map — interim stand-ins using existing landscape photos
 * (no dedicated 1200x630 art yet, and no trip photo exists at all).
 * TODO: replace with purpose-built 1200x630 art at /og/*.jpg
 * Mirrors the kind-keyed record shape used elsewhere in the app (programs are
 * keyed by `kind`, not by row) for consistency.
 */
export const OG_IMAGE_BY_KIND: Record<Program["kind"], string> = {
  dinner: "/photos/dinner-group.jpg",
  ride: "/photos/ride-coffee.jpg",
  trip: "/photos/dinner-group.jpg", // no dedicated trip photo exists yet
};

export const OG_IMAGE_DEFAULT = "/photos/dinner-group.jpg";

export function ogImageForKind(kind: Program["kind"]): string {
  return OG_IMAGE_BY_KIND[kind] ?? OG_IMAGE_DEFAULT;
}

export function ogImageForProgram(program: Program | null | undefined): string {
  if (!program) return OG_IMAGE_DEFAULT;
  return ogImageForKind(program.kind);
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  kind?: Program["kind"];
  /** Site-relative path to resolve through absoluteUrl() (e.g. "/photos/x.jpg"). */
  imagePath?: string;
  /** Already-absolute image URL (e.g. an R2 cover) — takes precedence over imagePath. */
  imageUrl?: string;
};

/**
 * Single factory every route's generateMetadata composes from — keeps
 * titles/cards consistent and the canonical rules in exactly one place.
 */
export function pageMetadata({ title, description, path, kind, imagePath, imageUrl }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const image = imageUrl ?? absoluteUrl(imagePath ?? (kind ? ogImageForKind(kind) : OG_IMAGE_DEFAULT));

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

// --- JSON-LD builders ---
// Plain objects consumed by <JsonLd data={...} /> (src/components/JsonLd.tsx).
// Builders omit optional keys when the source field is null so the emitted
// JSON-LD is always valid (KTD3/KTD4 graceful degradation).

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl(),
    logo: absoluteUrl("/brands/sidewalk-story.png"),
    areaServed: "Philadelphia, PA",
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl(),
  };
}

type EventJsonLdInput = {
  name: string;
  /** Local ISO date/time, e.g. "2026-07-19" or "2026-07-19T18:30". Omit when undecided. */
  startDate?: string | null;
  description?: string | null;
  location?: string | null;
  status?: "published" | "draft" | "cancelled";
  /** Free events (dinners) set true and get a zero-price offer; rides/trips just set true. */
  isAccessibleForFree?: boolean;
  /** Only dinners emit a zero-price `offers` block. */
  includeFreeOffer?: boolean;
  image: string;
};

/** Builds a schema.org Event object, omitting optional keys whose source is null. */
export function eventJsonLd(input: EventJsonLdInput) {
  const event: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: input.name,
    description: input.description || `Join us — details at ${siteUrl()}.`,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus:
      input.status === "cancelled"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    organizer: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteUrl(),
    },
    image: input.image,
  };

  if (input.startDate) {
    event.startDate = input.startDate;
  }

  if (input.location) {
    event.location = {
      "@type": "Place",
      name: input.location,
    };
  }

  if (input.isAccessibleForFree) {
    event.isAccessibleForFree = true;
  }

  if (input.includeFreeOffer) {
    event.offers = {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    };
  }

  return event;
}

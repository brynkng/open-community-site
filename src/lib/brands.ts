import type { Program } from "@/db/schema";

/**
 * Three-brand design system (mirrors the design prototype's `BRANDS` object in
 * `shared.jsx`). Brand identity is keyed by `programs.kind`, not by
 * `accentColor` — every dinner-kind program looks like Sidewalk Story, every
 * ride-kind program looks like Nomad Bike Philly, etc. `programs.accentColor`
 * (admin-editable) remains the dynamic primary and overrides the static
 * default when a program row provides one.
 */
export type BrandKey = "ss" | "nb" | "ft";

export interface BrandTokens {
  /** `data-brand` attribute value — resolves the CSS custom property scope in globals.css. */
  brandKey: BrandKey;
  name: string;
  tagline: string;
  /** CSS var reference for the brand's display font, e.g. "var(--font-ss)". */
  displayFontVar: string;
  /** Static fallback accent color (program.accentColor overrides this at render time). */
  accent: string;
  /** Emoji shown in place of a logo image when the program/brand has none. */
  emojiFallback: string | null;
  /** Instagram handle (no leading @), or null if the brand has no IG presence. */
  instagram: string | null;
}

const BRAND_BY_KIND: Record<Program["kind"], BrandTokens> = {
  dinner: {
    brandKey: "ss",
    name: "Sidewalk Story",
    tagline: "Saturday dinners",
    displayFontVar: "var(--font-ss)",
    accent: "#A8332A",
    emojiFallback: null,
    instagram: "sidewalk_story_philly",
  },
  ride: {
    brandKey: "nb",
    name: "Nomad Bike Philly",
    tagline: "Sunday rides",
    displayFontVar: "var(--font-nb)",
    accent: "#1F3A63",
    emojiFallback: null,
    instagram: "nomadic_bike_philly",
  },
  trip: {
    brandKey: "ft",
    name: "Trips",
    tagline: "Camping & hikes",
    displayFontVar: "var(--font-ft)",
    accent: "#2E5339",
    emojiFallback: "⛺",
    instagram: null,
  },
};

/** Brand tokens for a `kind`, independent of any specific program row. */
export function brandForKind(kind: Program["kind"]): BrandTokens {
  return BRAND_BY_KIND[kind];
}

/**
 * Resolve a program row to its brand tokens: the display font/emoji-fallback
 * are always the code-level brand for `kind`, while name/tagline/accent prefer
 * the program's own (admin-editable) values when present.
 */
export function brandForProgram(
  program: Pick<Program, "kind" | "name" | "tagline" | "accentColor">,
): BrandTokens {
  const base = brandForKind(program.kind);
  return {
    ...base,
    name: program.name || base.name,
    tagline: program.tagline || base.tagline,
    accent: program.accentColor || base.accent,
  };
}

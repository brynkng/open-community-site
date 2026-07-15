import type { CSSProperties } from "react";

/**
 * "Follow on Instagram" pill. Self-contained (inline SVG glyph — no asset), and
 * brand-agnostic: pass the handle + accent from the page's brand tokens. Styled
 * as a white pill so it reads over both the paper backgrounds and the dinner
 * hero video. Renders nothing when there's no handle, so callers can pass a
 * brand's `instagram` field directly.
 */
export function InstagramLink({
  handle,
  accent,
  style,
}: {
  handle: string | null | undefined;
  /** Brand accent (a `var(--brand-accent, …)` reference or hex). */
  accent?: string;
  style?: CSSProperties;
}) {
  if (!handle) return null;
  const clean = handle.replace(/^@/, "");
  return (
    <a
      href={`https://www.instagram.com/${clean}/`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Follow @${clean} on Instagram`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        minHeight: 40,
        padding: "8px 15px",
        borderRadius: 999,
        background: "#fff",
        color: accent ?? "var(--brand-accent)",
        fontWeight: 700,
        fontSize: 14,
        textDecoration: "none",
        boxShadow: "0 2px 8px rgba(43,33,24,.16)",
        touchAction: "manipulation",
        ...style,
      }}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flex: "none" }}
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
      @{clean}
    </a>
  );
}

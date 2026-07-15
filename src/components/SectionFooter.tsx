import Link from "next/link";
import { SubscribeForm } from "@/components/SubscribeForm";

/**
 * Site-wide footer: brand links + the newsletter signup (ports the design's
 * `SectionFooter` from shared.jsx, plus the newsletter section this replaces
 * from the old standalone homepage block).
 */
export function SectionFooter() {
  return (
    <footer
      className="ds-wrap"
      style={{
        padding: "36px 0 48px",
        textAlign: "center",
        color: "var(--ds-muted)",
        fontSize: 14,
      }}
    >
      <div
        id="newsletter"
        className="ds-card mx-auto max-w-xl"
        style={{ padding: "20px 22px", marginBottom: 28, textAlign: "left" }}
      >
        <h2 className="text-xl font-bold" style={{ color: "var(--ds-ink)" }}>
          Get the newsletter
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--ds-muted)" }}>
          Occasional emails about upcoming dinners, rides, and bigger trips. No
          spam, unsubscribe anytime.
        </p>
        <div className="mt-4">
          <SubscribeForm />
        </div>
      </div>

      <p style={{ margin: 0 }}>
        Made with love in South Philly. Everyone&rsquo;s invited &mdash; bring a
        friend.
      </p>
      <p style={{ margin: "6px 0 0" }}>
        <Link href="/dinner" style={{ color: "#a8332a" }}>
          Dinners
        </Link>{" "}
        &middot;{" "}
        <Link href="/rides" style={{ color: "#1f3a63" }}>
          Rides
        </Link>{" "}
        &middot;{" "}
        <Link href="/trips" style={{ color: "#2e5339" }}>
          Trips
        </Link>
      </p>
      <p style={{ margin: "6px 0 0" }}>
        <Link href="/admin" className="hover:opacity-70">
          Organizer sign in
        </Link>
      </p>
    </footer>
  );
}

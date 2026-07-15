"use client";

import { useState } from "react";
import Link from "next/link";
import type { Trip, TripPollOption, TripComment } from "@/db/schema";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";
import { TripSignup } from "@/components/TripSignup";
import { TripComments } from "@/components/TripComments";

/**
 * Derives the trip's `open`/`planning` status from its existing fields — no
 * new schema (KTD6, phases 5-8 plan): `planning` while the date poll is open
 * and no final date has been set; otherwise `open` (either a final date is
 * locked in, or the poll was closed without one). `cancelled` short-circuits
 * both.
 */
function tripStatus(trip: Trip): "planning" | "open" | "cancelled" {
  if (trip.status === "cancelled") return "cancelled";
  if (trip.pollOpen && !trip.finalDate) return "planning";
  return "open";
}

const CHIP_LABEL: Record<string, string> = {
  planning: "Still planning",
  open: "RSVPs open",
  cancelled: "Cancelled",
};

const CHIP_BG: Record<string, string> = {
  open: "var(--brand-accent, #2E5339)",
  planning: "var(--brand-accent-2, #6a8f5c)",
  cancelled: "#8a5a4a",
};

export function TripCard({
  trip,
  interested,
  pollOptions,
  comments,
  delay,
}: {
  trip: Trip;
  interested: number;
  pollOptions: TripPollOption[];
  comments: TripComment[];
  delay?: 0 | 1 | 2 | 3;
}) {
  const [open, setOpen] = useState(false);
  const img = trip.imageKey
    ? `${env().R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${trip.imageKey}`
    : null;
  const status = tripStatus(trip);
  const chip = { label: CHIP_LABEL[status], tone: status };
  const canSignUp = status !== "cancelled";

  return (
    <Reveal
      delay={delay ?? 0}
      className="ds-card"
      style={{ overflow: "hidden" }}
    >
      <div style={{ padding: "clamp(18px, 3vw, 28px)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <span
              className="ds-chip"
              style={{
                background: CHIP_BG[chip.tone],
                color: "#fff",
                marginBottom: 10,
              }}
            >
              {chip.label}
            </span>
            <h2
              style={{
                fontFamily: "var(--brand-font, inherit)",
                fontWeight: 800,
                fontSize: "clamp(20px, 2.8vw, 26px)",
                color: "var(--brand-accent-deep, inherit)",
                margin: "6px 0 0",
              }}
            >
              <Link href={`/trips/${trip.slug}`} className="hover:underline">
                {trip.title}
              </Link>
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontWeight: 800,
                color: "var(--brand-accent-3, inherit)",
                fontSize: 15,
              }}
            >
              {trip.finalDate
                ? `Confirmed: ${formatDate(trip.finalDate)}`
                : trip.tentativeWindow || "Date to be decided"}
            </p>
          </div>
          <span
            className="ds-chip"
            style={{
              background: "var(--brand-bg, rgba(43,33,24,.07))",
              color: "var(--brand-accent, inherit)",
            }}
          >
            {interested} going
          </span>
        </div>

        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={trip.title}
            className="mt-3 h-40 w-full rounded-xl object-cover"
          />
        )}

        {trip.description && (
          <p style={{ margin: "12px 0 0", maxWidth: 660, fontSize: 15.5 }}>
            {trip.description}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: 16,
            margin: "14px 0 0",
            flexWrap: "wrap",
            fontSize: 14,
            color: "var(--ds-muted)",
          }}
        >
          {trip.estCost && <span>💸 {trip.estCost}</span>}
          {trip.destination && <span>📍 {trip.destination}</span>}
        </div>

        {canSignUp && (
          <button
            type="button"
            className="ds-btn ghost"
            style={{
              color: "var(--brand-accent, inherit)",
              marginTop: 16,
              padding: "9px 18px",
            }}
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
          >
            {open ? "Hide details ▴" : "RSVP & details ▾"}
          </button>
        )}
      </div>

      {open && canSignUp && (
        <div
          style={{
            borderTop: "1px solid rgba(43,33,24,.08)",
            padding: "clamp(18px, 3vw, 28px)",
            background: "rgba(46,83,57,.035)",
            display: "grid",
            gap: 20,
          }}
        >
          {/* `planning` shows the existing date poll + interest form;
              `open` shows the same form with its poll fieldset naturally
              hidden (TripSignup's `showPoll = pollOpen && options.length`) —
              both states use it as the RSVP path (KTD6). */}
          <TripSignup
            tripId={trip.id}
            pollOpen={trip.pollOpen}
            options={pollOptions}
          />
          <TripComments tripId={trip.id} comments={comments} />
        </div>
      )}
    </Reveal>
  );
}

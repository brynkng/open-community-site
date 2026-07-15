"use client";

import { useState } from "react";
import Link from "next/link";
import type { Trip, TripPollOption } from "@/db/schema";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";
import { TripSignup } from "@/components/TripSignup";

/**
 * Derives a status chip from the trip's existing fields — no new schema.
 * Cancelled/confirmed take priority; otherwise "RSVPs open" while the date
 * poll is open, else "Still planning".
 */
function statusChip(trip: Trip): {
  label: string;
  tone: "confirmed" | "open" | "planning" | "cancelled";
} {
  if (trip.status === "cancelled")
    return { label: "Cancelled", tone: "cancelled" };
  if (trip.finalDate) return { label: "Confirmed", tone: "confirmed" };
  if (trip.pollOpen) return { label: "RSVPs open", tone: "open" };
  return { label: "Still planning", tone: "planning" };
}

const CHIP_BG: Record<string, string> = {
  confirmed: "var(--brand-accent, #2E5339)",
  open: "var(--brand-accent, #2E5339)",
  planning: "var(--brand-accent-2, #6a8f5c)",
  cancelled: "#8a5a4a",
};

export function TripCard({
  trip,
  interested,
  pollOptions,
  delay,
}: {
  trip: Trip;
  interested: number;
  pollOptions: TripPollOption[];
  delay?: 0 | 1 | 2 | 3;
}) {
  const [open, setOpen] = useState(false);
  const img = trip.imageKey
    ? `${env().R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${trip.imageKey}`
    : null;
  const chip = statusChip(trip);
  const canSignUp = trip.status !== "cancelled" && !trip.finalDate;

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
          }}
        >
          <TripSignup
            tripId={trip.id}
            pollOpen={trip.pollOpen}
            options={pollOptions}
          />
        </div>
      )}
    </Reveal>
  );
}

import Link from "next/link";
import type { Ride } from "@/db/schema";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/utils";

const paceLabel: Record<string, string> = {
  social: "Social pace",
  moderate: "Moderate",
  spirited: "Spirited",
};

export function RideCard({
  ride,
  headcount,
}: {
  ride: Ride;
  headcount: number;
}) {
  const img = ride.imageKey
    ? `${env().R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${ride.imageKey}`
    : null;

  return (
    <Link
      href={`/rides/${ride.slug}`}
      className="ds-card block p-5 transition hover:shadow-md"
    >
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={ride.title}
          className="mb-4 h-40 w-full rounded-xl object-cover"
        />
      )}
      <p
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: "var(--brand-accent, inherit)" }}
      >
        {formatDate(ride.date)}
        {ride.startTime ? ` · ${ride.startTime}` : ""}
      </p>
      <h3 className="mt-1 text-lg font-bold">{ride.title}</h3>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {ride.distanceKm ? (
          <span
            className="ds-chip"
            style={{ background: "rgba(43,33,24,.07)" }}
          >
            {ride.distanceKm} km
          </span>
        ) : null}
        {ride.paceLevel ? (
          <span
            className="ds-chip"
            style={{ background: "rgba(43,33,24,.07)" }}
          >
            {paceLabel[ride.paceLevel]}
          </span>
        ) : null}
        <span
          className="ds-chip"
          style={{
            background: "var(--brand-bg, rgba(43,33,24,.07))",
            color: "var(--brand-accent, inherit)",
          }}
        >
          {headcount} riding
        </span>
      </div>
    </Link>
  );
}

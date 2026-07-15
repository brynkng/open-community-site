import Link from "next/link";
import type { Ride } from "@/db/schema";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/utils";

const paceLabel: Record<string, string> = {
  social: "Social pace",
  moderate: "Moderate",
  spirited: "Spirited",
};

export function RideCard({ ride, headcount }: { ride: Ride; headcount: number }) {
  const img = ride.imageKey
    ? `${env().R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${ride.imageKey}`
    : null;

  return (
    <Link href={`/rides/${ride.slug}`} className="card block transition hover:shadow-md">
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={ride.title} className="mb-4 h-40 w-full rounded-xl object-cover" />
      )}
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">
        {formatDate(ride.date)}
        {ride.startTime ? ` · ${ride.startTime}` : ""}
      </p>
      <h3 className="mt-1 text-lg font-bold">{ride.title}</h3>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-600">
        {ride.distanceKm ? <span className="rounded-full bg-stone-100 px-2 py-0.5">{ride.distanceKm} km</span> : null}
        {ride.paceLevel ? <span className="rounded-full bg-stone-100 px-2 py-0.5">{paceLabel[ride.paceLevel]}</span> : null}
        <span className="rounded-full bg-brand-light/50 px-2 py-0.5 text-brand-dark">{headcount} riding</span>
      </div>
    </Link>
  );
}

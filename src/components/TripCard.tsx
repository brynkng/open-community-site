import Link from "next/link";
import type { Trip } from "@/db/schema";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/utils";

export function TripCard({ trip, interested }: { trip: Trip; interested: number }) {
  const img = trip.imageKey
    ? `${env().R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${trip.imageKey}`
    : null;

  return (
    <Link href={`/trips/${trip.slug}`} className="card block transition hover:shadow-md">
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={trip.title} className="mb-4 h-40 w-full rounded-xl object-cover" />
      )}
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">
        {trip.finalDate ? formatDate(trip.finalDate) : trip.tentativeWindow || "Date TBD"}
      </p>
      <h3 className="mt-1 text-lg font-bold">{trip.title}</h3>
      {trip.destination && <p className="text-sm text-stone-600">{trip.destination}</p>}
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-stone-600">
        {trip.estCost && <span className="rounded-full bg-stone-100 px-2 py-0.5">{trip.estCost}</span>}
        <span className="rounded-full bg-brand-light/50 px-2 py-0.5 text-brand-dark">
          {interested} interested
        </span>
        {trip.pollOpen && !trip.finalDate && (
          <span className="rounded-full bg-stone-100 px-2 py-0.5">poll open</span>
        )}
      </div>
    </Link>
  );
}

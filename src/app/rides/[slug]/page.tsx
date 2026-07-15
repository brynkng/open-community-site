import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { rides, rsvps } from "@/db/schema";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import { getProgramById } from "@/lib/programs";
import { RsvpForm } from "@/components/RsvpForm";
import { ProgramBadge } from "@/components/ProgramBadge";

export const dynamic = "force-dynamic";

export default async function RideDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = getDb();
  const [ride] = await db.select().from(rides).where(eq(rides.slug, slug)).limit(1);
  if (!ride || ride.status === "draft") notFound();

  const program = await getProgramById(ride.programId);

  const attendees = await db
    .select()
    .from(rsvps)
    .where(and(eq(rsvps.kind, "ride"), eq(rsvps.refId, ride.id)));
  const headcount = attendees.reduce((sum, r) => sum + r.partySize, 0);

  const img = ride.imageKey
    ? `${env().R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${ride.imageKey}`
    : null;

  return (
    <article className="mx-auto max-w-2xl space-y-8">
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={ride.title} className="h-64 w-full rounded-2xl object-cover" />
      )}

      <header>
        <div className="mb-2"><ProgramBadge program={program} /></div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          {formatDate(ride.date)}
          {ride.startTime ? ` · roll out ${ride.startTime}` : ""}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">{ride.title}</h1>
        {ride.status === "cancelled" && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            This ride has been cancelled.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-stone-600">
          {ride.meetLocation && <span className="rounded-full bg-stone-100 px-3 py-1">📍 {ride.meetLocation}</span>}
          {ride.distanceKm ? <span className="rounded-full bg-stone-100 px-3 py-1">{ride.distanceKm} km</span> : null}
          {ride.paceLevel && <span className="rounded-full bg-stone-100 px-3 py-1 capitalize">{ride.paceLevel} pace</span>}
          <span className="rounded-full bg-brand-light/50 px-3 py-1 text-brand-dark">{headcount} riding</span>
        </div>
      </header>

      {ride.description && (
        <div className="whitespace-pre-line leading-relaxed text-stone-700">{ride.description}</div>
      )}

      {ride.routeUrl && (
        <a href={ride.routeUrl} target="_blank" rel="noreferrer" className="btn-secondary">
          View the route ↗
        </a>
      )}

      {ride.status !== "cancelled" && (
        <div className="card">
          <h2 className="mb-4 text-lg font-bold">RSVP for this ride</h2>
          <RsvpForm kind="ride" refId={ride.id} />
        </div>
      )}
    </article>
  );
}

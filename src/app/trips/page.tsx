import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { trips, tripInterest } from "@/db/schema";
import { getProgramBySlug } from "@/lib/programs";
import { TripCard } from "@/components/TripCard";
import { ProgramHeader } from "@/components/ProgramHeader";

export const dynamic = "force-dynamic";

export default async function TripsPage({ searchParams }: { searchParams: Promise<{ program?: string }> }) {
  const { program: programSlug } = await searchParams;
  const program = programSlug ? await getProgramBySlug(programSlug) : null;

  const db = getDb();
  const where = program
    ? and(eq(trips.status, "published"), eq(trips.programId, program.id))
    : eq(trips.status, "published");
  const published = await db.select().from(trips).where(where).orderBy(desc(trips.createdAt));

  const ids = published.map((t) => t.id);
  const counts = new Map<number, number>();
  if (ids.length) {
    const rows = await db.select().from(tripInterest).where(inArray(tripInterest.tripId, ids));
    for (const r of rows) counts.set(r.tripId, (counts.get(r.tripId) || 0) + r.partySize);
  }

  return (
    <div className="space-y-8">
      {program ? (
        <ProgramHeader program={program} />
      ) : (
        <div className="text-center">
          <h1 className="text-3xl font-extrabold">Trips</h1>
          <p className="mt-2 text-stone-600">
            Bigger one-off adventures. Say you&apos;re interested and vote on the dates that work — we plan around the group.
          </p>
        </div>
      )}

      {published.length === 0 ? (
        <div className="card mx-auto max-w-xl text-center text-stone-600">No trips in the works yet — check back soon.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {published.map((trip) => (
            <TripCard key={trip.id} trip={trip} interested={counts.get(trip.id) || 0} />
          ))}
        </div>
      )}
    </div>
  );
}

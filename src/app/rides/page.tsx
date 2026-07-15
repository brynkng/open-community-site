import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { rides, rsvps } from "@/db/schema";
import { getProgramBySlug } from "@/lib/programs";
import { RideCard } from "@/components/RideCard";
import { ProgramHeader } from "@/components/ProgramHeader";

export const dynamic = "force-dynamic";

export default async function RidesPage({ searchParams }: { searchParams: Promise<{ program?: string }> }) {
  const { program: programSlug } = await searchParams;
  const program = programSlug ? await getProgramBySlug(programSlug) : null;

  const db = getDb();
  const where = program
    ? and(eq(rides.status, "published"), eq(rides.programId, program.id))
    : eq(rides.status, "published");
  const published = await db.select().from(rides).where(where).orderBy(desc(rides.date));

  const ids = published.map((r) => r.id);
  const counts = new Map<number, number>();
  if (ids.length) {
    const rows = await db.select().from(rsvps).where(inArray(rsvps.refId, ids));
    for (const r of rows) {
      if (r.kind !== "ride") continue;
      counts.set(r.refId, (counts.get(r.refId) || 0) + r.partySize);
    }
  }

  return (
    <div className="space-y-8">
      {program ? (
        <ProgramHeader program={program} />
      ) : (
        <div className="text-center">
          <h1 className="text-3xl font-extrabold">Rides</h1>
          <p className="mt-2 text-stone-600">
            Group rides most Sundays. Pick one, check the route, and RSVP so we roll out together.
          </p>
        </div>
      )}

      {published.length === 0 ? (
        <div className="card mx-auto max-w-xl text-center text-stone-600">No rides posted yet — check back soon.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {published.map((ride) => (
            <RideCard key={ride.id} ride={ride} headcount={counts.get(ride.id) || 0} />
          ))}
        </div>
      )}
    </div>
  );
}

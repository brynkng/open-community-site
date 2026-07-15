import { and, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { dinners, rsvps } from "@/db/schema";
import { getProgramBySlug } from "@/lib/programs";
import { formatDate } from "@/lib/utils";
import { RsvpForm } from "@/components/RsvpForm";
import { ProgramHeader } from "@/components/ProgramHeader";
import { DinnerBackground } from "@/components/DinnerBackground";

export const dynamic = "force-dynamic";

export default async function DinnerPage({ searchParams }: { searchParams: Promise<{ program?: string }> }) {
  const { program: programSlug } = await searchParams;
  const program = programSlug ? await getProgramBySlug(programSlug) : null;

  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const base = and(gte(dinners.date, today), eq(dinners.status, "published"));
  const where = program ? and(base, eq(dinners.programId, program.id)) : base;
  const [dinner] = await db.select().from(dinners).where(where).orderBy(dinners.date).limit(1);

  if (!dinner) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        {program && <ProgramHeader program={program} />}
        <div className="card text-center">
          <h1 className="text-2xl font-bold">Dinner</h1>
          <p className="mt-2 text-stone-600">
            The next dinner date isn&apos;t posted yet — check back soon or join the newsletter.
          </p>
        </div>
      </div>
    );
  }

  const attendees = await db
    .select()
    .from(rsvps)
    .where(and(eq(rsvps.kind, "dinner"), eq(rsvps.refId, dinner.id)));
  const headcount = attendees.reduce((sum, r) => sum + r.partySize, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section className="relative flex min-h-[70vh] flex-col justify-end overflow-hidden rounded-3xl sm:min-h-[460px]">
        <DinnerBackground />
        <div className="relative z-10 p-6 pb-8 text-center text-white sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/90 drop-shadow">
            {program ? `${program.name} · ` : ""}Free · All welcome
          </p>
          <h1 className="mt-2 text-3xl font-extrabold drop-shadow-lg sm:text-4xl">{dinner.title}</h1>
          <p className="mt-2 text-lg text-white/90 drop-shadow">
            {formatDate(dinner.date)}
            {dinner.startTime ? ` · ${dinner.startTime}` : ""}
            {dinner.location ? ` · ${dinner.location}` : ""}
          </p>
          <p className="mt-4 inline-block rounded-full bg-white/15 px-4 py-1 text-sm font-medium text-white backdrop-blur">
            {headcount} {headcount === 1 ? "person" : "people"} coming so far
            {dinner.capacity ? ` · ${Math.max(0, dinner.capacity - headcount)} seats left` : ""}
          </p>
          <div className="mt-5">
            <a href="#rsvp" className="btn bg-white text-ink hover:bg-white/90">RSVP now</a>
          </div>
        </div>
      </section>

      {dinner.description && (
        <p className="mx-auto max-w-prose whitespace-pre-line text-center text-stone-700">{dinner.description}</p>
      )}

      <div id="rsvp" className="card scroll-mt-20">
        <h2 className="mb-4 text-lg font-bold">RSVP</h2>
        <RsvpForm kind="dinner" refId={dinner.id} />
      </div>
    </div>
  );
}

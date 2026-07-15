import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  trips,
  tripInterest,
  tripPollOptions,
  tripPollVotes,
} from "@/db/schema";
import { env } from "@/lib/env";
import { formatDate } from "@/lib/utils";
import { getProgramById } from "@/lib/programs";
import { getTripComments } from "@/lib/board";
import { brandForProgram, brandForKind } from "@/lib/brands";
import { TripSignup } from "@/components/TripSignup";
import { TripComments } from "@/components/TripComments";
import { ProgramBadge } from "@/components/ProgramBadge";

export const dynamic = "force-dynamic";

/**
 * Derives the trip's `open`/`planning` status — mirrors `TripCard`'s
 * `tripStatus` (KTD6, phases 5-8 plan): no new schema, purely derived from
 * `pollOpen`/`finalDate`/`status`.
 */
function tripStatus(trip: {
  status: string;
  pollOpen: boolean;
  finalDate: string | null;
}): "planning" | "open" | "cancelled" {
  if (trip.status === "cancelled") return "cancelled";
  if (trip.pollOpen && !trip.finalDate) return "planning";
  return "open";
}

export default async function TripDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getDb();
  const [trip] = await db
    .select()
    .from(trips)
    .where(eq(trips.slug, slug))
    .limit(1);
  if (!trip || trip.status === "draft") notFound();

  const program = await getProgramById(trip.programId);
  const brand = program ? brandForProgram(program) : brandForKind("trip");
  const status = tripStatus(trip);

  const [interest, options, votes, comments] = await Promise.all([
    db.select().from(tripInterest).where(eq(tripInterest.tripId, trip.id)),
    db
      .select()
      .from(tripPollOptions)
      .where(eq(tripPollOptions.tripId, trip.id))
      .orderBy(asc(tripPollOptions.sortOrder), asc(tripPollOptions.id)),
    db.select().from(tripPollVotes).where(eq(tripPollVotes.tripId, trip.id)),
    getTripComments(trip.id),
  ]);

  const headcount = interest.reduce((s, r) => s + r.partySize, 0);
  const voterCount = new Set(votes.map((v) => v.voterEmail)).size;

  // Tally votes per option and find the leader.
  const tally = new Map<number, number>();
  for (const v of votes)
    tally.set(v.optionId, (tally.get(v.optionId) || 0) + 1);
  const maxVotes = Math.max(0, ...options.map((o) => tally.get(o.id) || 0));

  const img = trip.imageKey
    ? `${env().R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${trip.imageKey}`
    : null;

  const statusLabel =
    status === "planning"
      ? "Still planning"
      : status === "open"
        ? "RSVPs open"
        : "Cancelled";

  return (
    <article
      data-brand={brand.brandKey}
      className="mx-auto max-w-2xl space-y-8"
    >
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={trip.title}
          className="h-64 w-full rounded-2xl object-cover"
        />
      )}

      <header>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <ProgramBadge program={program} />
          <span
            className="ds-chip"
            style={{
              background:
                status === "cancelled"
                  ? "#8a5a4a"
                  : `var(--brand-accent, ${brand.accent})`,
              color: "#fff",
            }}
          >
            {statusLabel}
          </span>
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          {trip.finalDate
            ? `Confirmed: ${formatDate(trip.finalDate)}`
            : trip.tentativeWindow || "Date to be decided"}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">{trip.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-stone-600">
          {trip.destination && (
            <span className="rounded-full bg-stone-100 px-3 py-1">
              📍 {trip.destination}
            </span>
          )}
          {trip.estCost && (
            <span className="rounded-full bg-stone-100 px-3 py-1">
              💸 {trip.estCost}
            </span>
          )}
          <span className="rounded-full bg-brand-light/50 px-3 py-1 text-brand-dark">
            {headcount} interested
          </span>
        </div>
      </header>

      {trip.description && (
        <div className="whitespace-pre-line leading-relaxed text-stone-700">
          {trip.description}
        </div>
      )}

      {/* Poll results */}
      {options.length > 0 && (
        <section className="card">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">Best date so far</h2>
            <span className="text-xs text-stone-500">
              {voterCount} {voterCount === 1 ? "vote" : "votes"}
            </span>
          </div>
          {trip.finalDate ? (
            <p className="text-sm text-stone-600">
              The date is locked in — see you {formatDate(trip.finalDate)}!
            </p>
          ) : (
            <div className="space-y-2">
              {options.map((o) => {
                const n = tally.get(o.id) || 0;
                const pct = maxVotes ? Math.round((n / maxVotes) * 100) : 0;
                const leading = n > 0 && n === maxVotes;
                return (
                  <div key={o.id}>
                    <div className="mb-0.5 flex justify-between text-sm">
                      <span
                        className={
                          leading ? "font-semibold text-brand-dark" : ""
                        }
                      >
                        {o.label} {leading && "★"}
                      </span>
                      <span className="text-stone-500">{n}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                      <div
                        className={
                          leading ? "h-full bg-brand" : "h-full bg-brand/40"
                        }
                        style={{ width: `${Math.max(pct, n > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Signup + poll — `planning` keeps the date poll, `open` is the same
          form with its poll fieldset naturally hidden (KTD6); both are the
          RSVP path for a trip. */}
      {status !== "cancelled" && (
        <section className="card">
          <h2 className="mb-4 text-lg font-bold">Count me in</h2>
          <TripSignup
            tripId={trip.id}
            pollOpen={trip.pollOpen}
            options={options}
          />
        </section>
      )}

      {status === "cancelled" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          This trip has been cancelled.
        </p>
      )}

      {/* Trip talk — shown regardless of open/planning status (R3). */}
      <section className="card">
        <TripComments tripId={trip.id} comments={comments} />
      </section>
    </article>
  );
}

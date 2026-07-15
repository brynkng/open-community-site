import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  trips,
  tripInterest,
  tripPollOptions,
  tripPollVotes,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { TripEditForm } from "@/components/TripEditForm";
import {
  addPollOptionAction,
  deletePollOptionAction,
  setTripFinalDateAction,
  setTripStatusAction,
  publishTripToIgAction,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function ManageTrip({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const tripId = Number(id);
  const db = getDb();

  const [trip] = await db
    .select()
    .from(trips)
    .where(eq(trips.id, tripId))
    .limit(1);
  if (!trip) notFound();

  const [options, votes, interest] = await Promise.all([
    db
      .select()
      .from(tripPollOptions)
      .where(eq(tripPollOptions.tripId, tripId))
      .orderBy(asc(tripPollOptions.sortOrder), asc(tripPollOptions.id)),
    db.select().from(tripPollVotes).where(eq(tripPollVotes.tripId, tripId)),
    db.select().from(tripInterest).where(eq(tripInterest.tripId, tripId)),
  ]);

  const headcount = interest.reduce((s, r) => s + r.partySize, 0);
  const voterCount = new Set(votes.map((v) => v.voterEmail)).size;
  const tally = new Map<number, number>();
  for (const v of votes)
    tally.set(v.optionId, (tally.get(v.optionId) || 0) + 1);
  const maxVotes = Math.max(0, ...options.map((o) => tally.get(o.id) || 0));

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-brand hover:underline">
          ← Dashboard
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{trip.title}</h1>
          <Link
            href={`/trips/${trip.slug}`}
            className="text-sm text-brand hover:underline"
          >
            View public page ↗
          </Link>
        </div>
        <p className="mt-1 text-sm text-stone-600">
          {trip.status}
          {trip.finalDate
            ? ` · confirmed ${formatDate(trip.finalDate)}`
            : trip.tentativeWindow
              ? ` · ${trip.tentativeWindow}`
              : ""}
          {" · "}
          {headcount} interested · {voterCount} voted
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <form action={publishTripToIgAction}>
          <input type="hidden" name="tripId" value={trip.id} />
          <button
            className="btn-secondary"
            disabled={!trip.imageKey}
            title={trip.imageKey ? "" : "Add a cover image first"}
          >
            Post to Instagram
          </button>
        </form>
        {trip.status !== "cancelled" ? (
          <form action={setTripStatusAction}>
            <input type="hidden" name="tripId" value={trip.id} />
            <input type="hidden" name="status" value="cancelled" />
            <button className="btn-secondary">Cancel trip</button>
          </form>
        ) : (
          <form action={setTripStatusAction}>
            <input type="hidden" name="tripId" value={trip.id} />
            <input type="hidden" name="status" value="published" />
            <button className="btn-secondary">Restore trip</button>
          </form>
        )}
      </div>

      {/* Edit core details */}
      <section className="card">
        <h2 className="text-lg font-bold">Trip details</h2>
        <p className="mt-1 text-sm text-stone-600">
          Edit the title, destination, cost, window, and description shown on
          the public page.
        </p>
        <div className="mt-4">
          <TripEditForm trip={trip} />
        </div>
      </section>

      {/* Final date */}
      <section className="card">
        <h2 className="text-lg font-bold">Final date</h2>
        <p className="mt-1 text-sm text-stone-600">
          Setting a date closes the poll and shows it as confirmed on the public
          page. Clear it to reopen.
        </p>
        <form
          action={setTripFinalDateAction}
          className="mt-3 flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="tripId" value={trip.id} />
          <div>
            <label className="label" htmlFor="finalDate">
              Date
            </label>
            <input
              id="finalDate"
              name="finalDate"
              type="date"
              defaultValue={trip.finalDate ?? ""}
              className="input"
            />
          </div>
          <button className="btn-primary">Save &amp; notify</button>
        </form>
        {trip.finalDate && trip.finalDateNotified === trip.finalDate ? (
          <p className="mt-2 text-sm text-green-700">
            ✓ Emailed all {interest.length} interested{" "}
            {interest.length === 1 ? "person" : "people"} about{" "}
            {formatDate(trip.finalDate)}.
          </p>
        ) : trip.finalDate ? (
          <p className="mt-2 text-sm text-stone-500">
            Saving will email everyone interested.
          </p>
        ) : null}
      </section>

      {/* Poll options + results */}
      <section className="card">
        <h2 className="text-lg font-bold">Poll dates</h2>
        <div className="mt-3 space-y-2">
          {options.map((o) => {
            const n = tally.get(o.id) || 0;
            const pct = maxVotes ? Math.round((n / maxVotes) * 100) : 0;
            const leading = n > 0 && n === maxVotes;
            return (
              <div key={o.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="mb-0.5 flex justify-between text-sm">
                    <span
                      className={leading ? "font-semibold text-brand-dark" : ""}
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
                <form action={deletePollOptionAction}>
                  <input type="hidden" name="optionId" value={o.id} />
                  <input type="hidden" name="tripId" value={trip.id} />
                  <button
                    className="text-xs text-red-600 hover:underline"
                    title="Remove option"
                  >
                    ✕
                  </button>
                </form>
              </div>
            );
          })}
          {options.length === 0 && (
            <p className="text-sm text-stone-500">
              No dates yet — add some below.
            </p>
          )}
        </div>

        <form
          action={addPollOptionAction}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="tripId" value={trip.id} />
          <div className="flex-1">
            <label className="label" htmlFor="label">
              Add a date option
            </label>
            <input
              id="label"
              name="label"
              required
              className="input"
              placeholder="Sat Oct 10"
            />
          </div>
          <button className="btn-secondary">Add</button>
        </form>
      </section>

      {/* Interest list */}
      <section className="card">
        <h2 className="text-lg font-bold">Interested ({headcount})</h2>
        <div className="mt-3 divide-y divide-stone-100">
          {interest.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between py-2 text-sm"
            >
              <div>
                <span className="font-medium">{r.name}</span>{" "}
                <span className="text-stone-500">{r.email}</span>
                {r.note ? (
                  <p className="text-xs text-stone-500">{r.note}</p>
                ) : null}
              </div>
              <span className="text-stone-600">party of {r.partySize}</span>
            </div>
          ))}
          {interest.length === 0 && (
            <p className="py-2 text-sm text-stone-500">No sign-ups yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

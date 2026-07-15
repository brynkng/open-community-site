import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  dinners,
  rides,
  eventSeries,
  rsvps,
  subscribers,
  igPosts,
  trips,
  tripInterest,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import {
  logoutAction,
  setRideStatusAction,
  publishRideToIgAction,
  setSeriesActiveAction,
  deleteSeriesAction,
} from "./actions";

const WEEKDAYS = [
  "Sundays",
  "Mondays",
  "Tuesdays",
  "Wednesdays",
  "Thursdays",
  "Fridays",
  "Saturdays",
];

export const dynamic = "force-dynamic";

async function headcountFor(
  kind: "dinner" | "ride",
  refId: number,
): Promise<number> {
  const rows = await getDb().select().from(rsvps).where(eq(rsvps.refId, refId));
  return rows
    .filter((r) => r.kind === kind)
    .reduce((s, r) => s + r.partySize, 0);
}

export default async function AdminDashboard() {
  await requireAdmin();
  const db = getDb();

  const [dinnerList, rideList, tripList, seriesList, subs, recentIg] =
    await Promise.all([
      db.select().from(dinners).orderBy(desc(dinners.date)).limit(10),
      db.select().from(rides).orderBy(desc(rides.date)).limit(20),
      db.select().from(trips).orderBy(desc(trips.createdAt)).limit(20),
      db.select().from(eventSeries).orderBy(desc(eventSeries.createdAt)),
      db.select().from(subscribers),
      db.select().from(igPosts).orderBy(desc(igPosts.createdAt)).limit(5),
    ]);

  const dinnerCounts = await Promise.all(
    dinnerList.map((d) => headcountFor("dinner", d.id)),
  );
  const rideCounts = await Promise.all(
    rideList.map((r) => headcountFor("ride", r.id)),
  );
  const tripCounts = await Promise.all(
    tripList.map(async (t) => {
      const rows = await db
        .select()
        .from(tripInterest)
        .where(eq(tripInterest.tripId, t.id));
      return rows.reduce((s, r) => s + r.partySize, 0);
    }),
  );

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Organizer dashboard</h1>
        <form action={logoutAction}>
          <button className="btn-secondary">Sign out</button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-3xl font-bold text-brand">{subs.length}</p>
          <p className="text-sm text-stone-600">newsletter subscribers</p>
        </div>
        <div className="card">
          <p className="text-3xl font-bold text-brand">{dinnerList.length}</p>
          <p className="text-sm text-stone-600">dinners posted</p>
        </div>
        <div className="card">
          <p className="text-3xl font-bold text-brand">{rideList.length}</p>
          <p className="text-sm text-stone-600">rides posted</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/dinners/new" className="btn-primary">
          + New dinner
        </Link>
        <Link href="/admin/rides/new" className="btn-primary">
          + New ride
        </Link>
        <Link href="/admin/trips/new" className="btn-primary">
          + New trip
        </Link>
        <Link href="/admin/programs" className="btn-secondary">
          Manage programs
        </Link>
        <Link href="/admin/newsletter" className="btn-secondary">
          Send newsletter
        </Link>
        <Link href="/admin/moderation" className="btn-secondary">
          Moderation
        </Link>
      </div>

      {/* Recurring series */}
      {seriesList.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Recurring series</h2>
          <div className="space-y-2">
            {seriesList.map((s) => (
              <div
                key={s.id}
                className="card flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-semibold">
                    {s.title}
                    {!s.active && (
                      <span className="ml-2 text-xs font-normal text-amber-700">
                        paused
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-stone-600">
                    {s.kind === "dinner" ? "Dinner" : "Ride"} · every{" "}
                    {WEEKDAYS[s.weekday]}
                    {s.startTime ? ` at ${s.startTime}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={setSeriesActiveAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={s.active ? "false" : "true"}
                    />
                    <button className="btn-secondary">
                      {s.active ? "Pause" : "Resume"}
                    </button>
                  </form>
                  <form action={deleteSeriesAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="btn-secondary">Delete series</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Upcoming dates are generated automatically. Deleting a series keeps
            any dates people have already RSVPed to.
          </p>
        </section>
      )}

      {/* Dinners */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Saturday dinners</h2>
        <div className="space-y-2">
          {dinnerList.map((d, i) => (
            <div
              key={d.id}
              className="card flex items-center justify-between py-3"
            >
              <div>
                <p className="font-semibold">{d.title}</p>
                <p className="text-sm text-stone-600">
                  {formatDate(d.date)} · {d.status}
                </p>
              </div>
              <p className="text-sm font-medium text-brand-dark">
                {dinnerCounts[i]} coming
              </p>
            </div>
          ))}
          {dinnerList.length === 0 && (
            <p className="text-sm text-stone-500">No dinners yet.</p>
          )}
        </div>
      </section>

      {/* Rides */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Sunday rides</h2>
        <div className="space-y-2">
          {rideList.map((r, i) => (
            <div
              key={r.id}
              className="card flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="font-semibold">{r.title}</p>
                <p className="text-sm text-stone-600">
                  {formatDate(r.date)} · {r.status} · {rideCounts[i]} riding
                  {r.imageKey ? "" : " · no image"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={publishRideToIgAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    className="btn-secondary"
                    disabled={!r.imageKey}
                    title={r.imageKey ? "" : "Add a cover image first"}
                  >
                    Post to Instagram
                  </button>
                </form>
                {r.status !== "cancelled" ? (
                  <form action={setRideStatusAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value="cancelled" />
                    <button className="btn-secondary">Cancel</button>
                  </form>
                ) : (
                  <form action={setRideStatusAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value="published" />
                    <button className="btn-secondary">Restore</button>
                  </form>
                )}
              </div>
            </div>
          ))}
          {rideList.length === 0 && (
            <p className="text-sm text-stone-500">No rides yet.</p>
          )}
        </div>
      </section>

      {/* Trips */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Trips</h2>
        <div className="space-y-2">
          {tripList.map((t, i) => (
            <Link
              key={t.id}
              href={`/admin/trips/${t.id}`}
              className="card flex items-center justify-between py-3 transition hover:shadow-md"
            >
              <div>
                <p className="font-semibold">{t.title}</p>
                <p className="text-sm text-stone-600">
                  {t.finalDate
                    ? `confirmed ${formatDate(t.finalDate)}`
                    : t.tentativeWindow || "date TBD"}{" "}
                  · {t.status}
                  {t.pollOpen && !t.finalDate ? " · poll open" : ""}
                </p>
              </div>
              <p className="text-sm font-medium text-brand-dark">
                {tripCounts[i]} interested
              </p>
            </Link>
          ))}
          {tripList.length === 0 && (
            <p className="text-sm text-stone-500">No trips yet.</p>
          )}
        </div>
      </section>

      {/* Recent IG activity */}
      {recentIg.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Recent Instagram posts</h2>
          <div className="space-y-2">
            {recentIg.map((p) => (
              <div key={p.id} className="card py-3 text-sm">
                <span
                  className={
                    p.status === "published"
                      ? "font-medium text-green-700"
                      : p.status === "failed"
                        ? "font-medium text-red-700"
                        : "font-medium text-stone-600"
                  }
                >
                  {p.status}
                </span>
                {" — "}
                {p.caption.slice(0, 60)}
                {p.error ? (
                  <span className="block text-xs text-red-600">{p.error}</span>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

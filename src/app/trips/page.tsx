import type { Metadata } from "next";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  trips,
  tripInterest,
  tripPollOptions,
  tripComments,
} from "@/db/schema";
import { getProgramBySlug, defaultProgramIdForKind } from "@/lib/programs";
import { brandForProgram, brandForKind } from "@/lib/brands";
import { getTripComments } from "@/lib/board";
import { loadCommunitySections } from "@/lib/communitySections";
import { TripCard } from "@/components/TripCard";
import { Reveal } from "@/components/Reveal";
import { pageMetadata, ogImageForProgram } from "@/lib/seo";
import { AlbumSection } from "@/components/AlbumSection";
import { Board } from "@/components/Board";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ program?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { program: programSlug } = await searchParams;
  const program = programSlug ? await getProgramBySlug(programSlug) : null;
  const title = program ? `${program.name} — Community Trips` : "Trips";
  const description = program?.tagline
    ? `${program.tagline} Bigger one-off adventures, planned together.`
    : "Bigger one-off adventures. Say you're interested and vote on the dates that work — we plan around the group.";
  // Canonical is always the clean, un-parameterized path (Q2).
  return pageMetadata({
    title,
    description,
    path: "/trips",
    kind: "trip",
    imagePath: ogImageForProgram(program),
  });
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { program: programSlug } = await searchParams;
  const program = programSlug ? await getProgramBySlug(programSlug) : null;
  const brand = program ? brandForProgram(program) : brandForKind("trip");
  const programId = program?.id ?? (await defaultProgramIdForKind("trip"));

  const db = getDb();
  const where = program
    ? and(eq(trips.status, "published"), eq(trips.programId, program.id))
    : eq(trips.status, "published");
  const published = await db
    .select()
    .from(trips)
    .where(where)
    .orderBy(desc(trips.createdAt));

  const ids = published.map((t) => t.id);
  const counts = new Map<number, number>();
  const optionsByTrip = new Map<
    number,
    (typeof tripPollOptions.$inferSelect)[]
  >();
  const commentsByTrip = new Map<
    number,
    (typeof tripComments.$inferSelect)[]
  >();
  if (ids.length) {
    const [interestRows, optionRows, commentRows] = await Promise.all([
      db.select().from(tripInterest).where(inArray(tripInterest.tripId, ids)),
      db
        .select()
        .from(tripPollOptions)
        .where(inArray(tripPollOptions.tripId, ids))
        .orderBy(asc(tripPollOptions.sortOrder), asc(tripPollOptions.id)),
      Promise.all(ids.map((id) => getTripComments(id))),
    ]);
    for (const r of interestRows)
      counts.set(r.tripId, (counts.get(r.tripId) || 0) + r.partySize);
    for (const o of optionRows) {
      const list = optionsByTrip.get(o.tripId) ?? [];
      list.push(o);
      optionsByTrip.set(o.tripId, list);
    }
    ids.forEach((id, i) => commentsByTrip.set(id, commentRows[i]));
  }

  // Albums + board for the trip program (server-fetched so the client
  // sections don't need their own data-fetch round trip).
  const { albumSection, boardPosts, myVotes } = await loadCommunitySections(
    programId,
    brand.brandKey,
  );

  return (
    <div data-brand={brand.brandKey} className="ds-page">
      <header
        className="ds-wrap"
        style={{
          paddingTop: "clamp(20px,4vw,40px)",
          paddingBottom: "clamp(16px,3vw,28px)",
        }}
      >
        <Reveal style={{ maxWidth: 640 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <span
              className="ds-float-slow"
              aria-hidden
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                background: `var(--brand-accent-3, ${brand.accent})`,
                display: "grid",
                placeItems: "center",
                fontSize: 26,
                boxShadow: "var(--ds-shadow)",
              }}
            >
              {brand.emojiFallback ?? "⛺"}
            </span>
            <p
              style={{
                margin: 0,
                fontFamily: brand.displayFontVar,
                fontWeight: 700,
                fontSize: 19,
                color: `var(--brand-accent, ${brand.accent})`,
              }}
            >
              {brand.name}
            </p>
          </div>
          <h1
            style={{
              fontFamily: brand.displayFontVar,
              fontWeight: 800,
              fontSize: "clamp(28px, 4.6vw, 48px)",
              color: `var(--brand-accent-deep, ${brand.accent})`,
              letterSpacing: "-.015em",
              margin: 0,
            }}
          >
            Sometimes the neighborhood goes camping.
          </h1>
          <p
            style={{
              fontSize: "clamp(15px, 1.8vw, 18px)",
              margin: "14px 0 0",
              color: "var(--ds-ink)",
            }}
          >
            Camping, hikes, and day trips planned together in the open. Anyone
            from the community is invited. Free unless there&rsquo;s real costs
            to split — and we&rsquo;ll always say so up front.
          </p>
        </Reveal>
      </header>

      <section
        className="ds-wrap"
        style={{ paddingTop: 10, paddingBottom: 50, display: "grid", gap: 22 }}
      >
        {published.length === 0 ? (
          <div
            className="ds-card"
            style={{
              padding: 24,
              textAlign: "center",
              color: "var(--ds-muted)",
            }}
          >
            No trips in the works yet — check back soon.
          </div>
        ) : (
          published.map((trip, i) => (
            <TripCard
              key={trip.id}
              trip={trip}
              interested={counts.get(trip.id) || 0}
              pollOptions={optionsByTrip.get(trip.id) ?? []}
              comments={commentsByTrip.get(trip.id) ?? []}
              delay={Math.min(i, 3) as 0 | 1 | 2 | 3}
            />
          ))
        )}

        <Reveal
          className="ds-card"
          style={{
            padding: "22px 24px",
            borderStyle: "dashed",
            borderWidth: 2,
            borderColor: "var(--brand-accent-2, #6a8f5c)",
            background: "transparent",
            boxShadow: "none",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontFamily: brand.displayFontVar,
              fontWeight: 700,
              fontSize: 18,
              color: `var(--brand-accent, ${brand.accent})`,
              margin: 0,
            }}
          >
            Got a trip idea?
          </h3>
          <p
            style={{
              margin: "6px auto 0",
              maxWidth: 420,
              fontSize: 14.5,
              color: "var(--ds-muted)",
            }}
          >
            Pitch it to the group — if a few people bite, we&rsquo;ll plan it
            together.
          </p>
        </Reveal>
      </section>

      {programId && (
        <>
          <section className="ds-wrap" style={{ paddingBottom: 50 }}>
            <AlbumSection
              programId={programId}
              kind="trip"
              albums={albumSection}
            />
          </section>
          <section className="ds-wrap" style={{ paddingBottom: 60 }}>
            <Board
              programId={programId}
              kind="trip"
              posts={boardPosts}
              myVotes={myVotes}
            />
          </section>
        </>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { rides, rsvps } from "@/db/schema";
import { getProgramBySlug, defaultProgramIdForKind } from "@/lib/programs";
import { formatDate, formatTime } from "@/lib/utils";
import { brandForProgram, brandForKind } from "@/lib/brands";
import { loadCommunitySections } from "@/lib/communitySections";
import { RideCard } from "@/components/RideCard";
import { RsvpWidget } from "@/components/RsvpWidget";
import { Reveal } from "@/components/Reveal";
import { pageMetadata, ogImageForProgram } from "@/lib/seo";
import { AlbumSection } from "@/components/AlbumSection";
import { Board } from "@/components/Board";
import { InfoTip } from "@/components/InfoTip";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ program?: string }>;

const ROUTE_STOPS: [string, string, string][] = [
  ["South Philly", "Roll out at 10 AM sharp", "0 mi"],
  ["Schuylkill River Trail", "Flat, car-free, river views", "3 mi"],
  ["Manayunk — Main St", "Coffee, snacks, long sit", "10 mi"],
  ["Back home", "Same trail, easy pace", "20 mi"],
];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { program: programSlug } = await searchParams;
  const program = programSlug ? await getProgramBySlug(programSlug) : null;
  const title = program ? `${program.name} — Sunday Bike Rides` : "Rides";
  const description = program?.tagline
    ? `${program.tagline} Group bike rides most Sundays in Philadelphia.`
    : "Group bike rides most Sundays in Philadelphia. Pick one, check the route, and RSVP so we roll out together.";
  // Canonical is always the clean, un-parameterized path (Q2).
  return pageMetadata({
    title,
    description,
    path: "/rides",
    kind: "ride",
    imagePath: ogImageForProgram(program),
  });
}

export default async function RidesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { program: programSlug } = await searchParams;
  const program = programSlug ? await getProgramBySlug(programSlug) : null;
  const brand = program ? brandForProgram(program) : brandForKind("ride");
  const programId = program?.id ?? (await defaultProgramIdForKind("ride"));
  const { albumSection, boardPosts, myVotes } = await loadCommunitySections(
    programId,
    brand.brandKey,
  );

  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const where = program
    ? and(eq(rides.status, "published"), eq(rides.programId, program.id))
    : eq(rides.status, "published");
  const published = await db
    .select()
    .from(rides)
    .where(where)
    .orderBy(desc(rides.date));

  const ids = published.map((r) => r.id);
  const counts = new Map<number, number>();
  const namesByRide = new Map<number, string[]>();
  if (ids.length) {
    const rows = await db
      .select()
      .from(rsvps)
      .where(inArray(rsvps.refId, ids))
      .orderBy(desc(rsvps.createdAt));
    for (const r of rows) {
      if (r.kind !== "ride") continue;
      counts.set(r.refId, (counts.get(r.refId) || 0) + r.partySize);
      if (r.name) {
        const list = namesByRide.get(r.refId) ?? [];
        list.push(r.name);
        namesByRide.set(r.refId, list);
      }
    }
  }

  // Feature the soonest upcoming published ride with an inline RsvpWidget;
  // the rest still list below via RideCard (which link to their own detail
  // page + full RsvpForm, unchanged/out of scope for this slice).
  const [nextRide] = await db
    .select()
    .from(rides)
    .where(
      program
        ? and(
            eq(rides.status, "published"),
            eq(rides.programId, program.id),
            gte(rides.date, today),
          )
        : and(eq(rides.status, "published"), gte(rides.date, today)),
    )
    .orderBy(asc(rides.date))
    .limit(1);

  const otherRides = published.filter((r) => r.id !== nextRide?.id);

  return (
    <div data-brand={brand.brandKey} className="ds-page">
      {/* hero */}
      <header className="ds-wrap" style={{ padding: "clamp(20px,4vw,40px) 0" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: "clamp(20px, 4vw, 40px)",
            alignItems: "center",
          }}
        >
          <Reveal>
            <Image
              src="/brands/nomadic-bike-philly.png"
              alt={brand.name}
              width={320}
              height={320}
              className="ds-float-slow ds-ride-logo"
              style={{
                width: "min(320px, 72vw)",
                height: "auto",
                marginBottom: 16,
              }}
            />
            <h1
              style={{
                fontFamily: brand.displayFontVar,
                fontWeight: 900,
                fontSize: "clamp(26px, 4.6vw, 46px)",
                color: `var(--brand-accent, ${brand.accent})`,
                textTransform: "uppercase",
                letterSpacing: "-.01em",
                margin: 0,
              }}
            >
              Twenty easy miles, one great coffee.
            </h1>
            <p
              style={{
                fontSize: "clamp(15px, 1.8vw, 18px)",
                maxWidth: 480,
                margin: "14px 0 0",
                color: "var(--ds-ink)",
              }}
            >
              Every Sunday at 10 AM we ride from South Philly up the Schuylkill
              to Manayunk, get coffee on Main Street, and roll home. No-drop,
              all bikes, all paces — if you can ride around the block, you can
              ride with us.
            </p>
            <div
              style={{
                display: "flex",
                gap: 10,
                margin: "18px 0 0",
                flexWrap: "wrap",
              }}
            >
              <span
                className="ds-chip"
                style={{
                  background: "#fff",
                  color: `var(--brand-accent, ${brand.accent})`,
                }}
              >
                ☕ Coffee stop
              </span>
              <span
                className="ds-chip"
                style={{
                  background: "#fff",
                  color: `var(--brand-accent, ${brand.accent})`,
                }}
              >
                🚳 No-drop
                <InfoTip
                  label="What does no-drop mean?"
                  text="No-drop means nobody gets left behind — we regroup and wait for slower riders, so you always have the group in sight."
                />
              </span>
              <span
                className="ds-chip"
                style={{
                  background: "#fff",
                  color: `var(--brand-accent, ${brand.accent})`,
                }}
              >
                🛤 Mostly trail
              </span>
            </div>
          </Reveal>

          <Reveal delay={1}>
            {nextRide ? (
              <div style={{ display: "grid", gap: 14 }}>
                <div
                  className="ds-card"
                  style={{
                    padding: "18px 22px",
                    background: `var(--brand-accent, ${brand.accent})`,
                    color: "#fff",
                    border: "none",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      letterSpacing: ".1em",
                      textTransform: "uppercase",
                      opacity: 0.85,
                    }}
                  >
                    Next ride
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontFamily: brand.displayFontVar,
                      fontWeight: 800,
                      fontSize: "clamp(18px, 2.4vw, 24px)",
                    }}
                  >
                    {nextRide.title}
                  </p>
                  <p
                    style={{ margin: "6px 0 0", fontSize: 14.5, opacity: 0.9 }}
                  >
                    {formatDate(nextRide.date)}
                    {nextRide.startTime
                      ? ` · ${formatTime(nextRide.startTime)}`
                      : ""}
                    {nextRide.meetLocation ? ` · ${nextRide.meetLocation}` : ""}
                  </p>
                </div>
                <RsvpWidget
                  kind="ride"
                  refId={nextRide.id}
                  initialHeadcount={counts.get(nextRide.id) || 0}
                  recentNames={namesByRide.get(nextRide.id) ?? []}
                  prompt="Riding this Sunday?"
                />
              </div>
            ) : (
              <div
                className="ds-card"
                style={{
                  padding: 22,
                  textAlign: "center",
                  color: "var(--ds-muted)",
                }}
              >
                No rides posted yet — check back soon.
              </div>
            )}
          </Reveal>
        </div>
      </header>

      {/* route strip */}
      <section className="ds-wrap" style={{ padding: "10px 0 44px" }}>
        <Reveal>
          <div
            className="ds-card"
            style={{ padding: "clamp(18px, 3vw, 28px)", overflow: "hidden" }}
          >
            <p
              style={{
                margin: "0 0 18px",
                fontWeight: 800,
                letterSpacing: ".06em",
                textTransform: "uppercase",
                fontSize: 13,
                color: "var(--brand-accent-2, var(--ds-muted))",
              }}
            >
              The route
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
                gap: 0,
              }}
            >
              {ROUTE_STOPS.map(([name, sub, mi], i) => (
                <div
                  key={name}
                  style={{ position: "relative", padding: "0 14px 0 0" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        flex: "none",
                        background:
                          i === 2
                            ? "var(--brand-accent-3, #6f4a2b)"
                            : `var(--brand-accent, ${brand.accent})`,
                        boxShadow: `0 0 0 4px ${
                          i === 2 ? "rgba(111,74,43,.18)" : "rgba(31,58,99,.15)"
                        }`,
                      }}
                    />
                    {i < ROUTE_STOPS.length - 1 && (
                      <span
                        style={{
                          flex: 1,
                          height: 3,
                          opacity: 0.6,
                          background:
                            "repeating-linear-gradient(90deg, var(--brand-accent-2, var(--ds-muted)) 0 8px, transparent 8px 14px)",
                        }}
                      />
                    )}
                  </div>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 15.5 }}>
                    {name}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 13.5,
                      color: "var(--ds-muted)",
                    }}
                  >
                    {sub}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12.5,
                      fontWeight: 800,
                      color: "var(--brand-accent-2, var(--ds-muted))",
                    }}
                  >
                    {mi}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* other upcoming/recent rides */}
      <section className="ds-wrap" style={{ padding: "0 0 60px" }}>
        {otherRides.length > 0 && (
          <>
            <h2
              className="ds-section-title"
              style={{ fontFamily: brand.displayFontVar }}
            >
              More rides
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {otherRides.map((ride) => (
                <RideCard
                  key={ride.id}
                  ride={ride}
                  headcount={counts.get(ride.id) || 0}
                />
              ))}
            </div>
          </>
        )}
        {published.length === 0 && (
          <div
            className="ds-card mx-auto max-w-xl text-center"
            style={{ padding: 22, color: "var(--ds-muted)" }}
          >
            No rides posted yet — check back soon.
          </div>
        )}
      </section>

      {programId && (
        <>
          <section className="ds-wrap" style={{ padding: "0 0 50px" }}>
            <AlbumSection
              programId={programId}
              kind="ride"
              albums={albumSection}
            />
          </section>
          <section className="ds-wrap" style={{ padding: "0 0 60px" }}>
            <Board
              programId={programId}
              kind="ride"
              posts={boardPosts}
              myVotes={myVotes}
            />
          </section>
        </>
      )}
    </div>
  );
}

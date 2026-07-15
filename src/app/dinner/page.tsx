import type { Metadata } from "next";
import { and, desc, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { dinners, rsvps } from "@/db/schema";
import {
  getProgramBySlug,
  getProgramById,
  defaultProgramIdForKind,
} from "@/lib/programs";
import { formatDate, formatTime } from "@/lib/utils";
import { brandForProgram, brandForKind } from "@/lib/brands";
import { loadCommunitySections } from "@/lib/communitySections";
import { RsvpWidget } from "@/components/RsvpWidget";
import { DinnerBackground } from "@/components/DinnerBackground";
import { Reveal } from "@/components/Reveal";
import { AlbumSection } from "@/components/AlbumSection";
import { Board } from "@/components/Board";
import Image from "next/image";
import Link from "next/link";
import { dinnerSlug } from "@/lib/dinner-permalink";
import { pageMetadata, ogImageForProgram } from "@/lib/seo";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ program?: string }>;

const HOW_IT_WORKS: [string, string][] = [
  ["Show up hungry", "Doors open at 6 and we start making the pies."],
  ["Bring nothing", "Seriously. Not even a drink. Just come."],
  [
    "Bring anyone",
    "Friends, kids, dogs, that neighbor you keep meaning to talk to.",
  ],
];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { program: programSlug } = await searchParams;
  const program = programSlug ? await getProgramBySlug(programSlug) : null;
  const title = program
    ? `${program.name} — Free Saturday Dinner`
    : "Saturday Dinner";
  const description = program?.tagline
    ? `${program.tagline} Free weekly community dinner, all welcome.`
    : "A free weekly community dinner in Philadelphia. Everyone is welcome at our table — RSVP for the next date.";
  // Canonical is always the clean, un-parameterized path (Q2) — ?program=
  // variants are content-identical today, so they share one canonical.
  return pageMetadata({
    title,
    description,
    path: "/dinner",
    kind: "dinner",
    imagePath: ogImageForProgram(program),
  });
}

export default async function DinnerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { program: programSlug } = await searchParams;
  const program = programSlug ? await getProgramBySlug(programSlug) : null;
  const brand = program ? brandForProgram(program) : brandForKind("dinner");
  const programId = program?.id ?? (await defaultProgramIdForKind("dinner"));
  const { albumSection, boardPosts, myVotes } = await loadCommunitySections(
    programId,
    brand.brandKey,
  );

  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const base = and(gte(dinners.date, today), eq(dinners.status, "published"));
  const where = program ? and(base, eq(dinners.programId, program.id)) : base;
  const [dinner] = await db
    .select()
    .from(dinners)
    .where(where)
    .orderBy(dinners.date)
    .limit(1);

  if (!dinner) {
    return (
      <div data-brand={brand.brandKey} className="ds-page">
        <Reveal
          as="header"
          className="ds-wrap"
          style={{
            paddingTop: "clamp(36px, 7vw, 80px)",
            paddingBottom: "clamp(20px,3vw,36px)",
            textAlign: "center",
          }}
        >
          <Image
            src="/brands/sidewalk-story.png"
            alt={`${brand.name} logo`}
            width={320}
            height={320}
            className="ds-float-slow mx-auto"
            style={{
              width: "min(320px, 72vw)",
              height: "auto",
              mixBlendMode: "multiply",
            }}
          />
          <h1
            style={{
              fontFamily: brand.displayFontVar,
              fontSize: "clamp(28px, 4.4vw, 44px)",
              color: `var(--brand-accent-deep, ${brand.accent})`,
              margin: "18px 0 0",
            }}
          >
            Saturday Dinners
          </h1>
        </Reveal>
        <div className="ds-wrap" style={{ paddingBottom: 60 }}>
          <Reveal
            delay={1}
            className="ds-card mx-auto max-w-xl text-center"
            style={{ padding: 28 }}
          >
            <p style={{ color: "var(--ds-muted)" }}>
              The next dinner date isn&apos;t posted yet — check back soon or
              join the newsletter.
            </p>
          </Reveal>
        </div>

        {programId && (
          <>
            <div className="ds-wrap" style={{ paddingBottom: 50 }}>
              <AlbumSection
                programId={programId}
                kind="dinner"
                albums={albumSection}
              />
            </div>
            <div className="ds-wrap" style={{ paddingBottom: 60 }}>
              <Board
                programId={programId}
                kind="dinner"
                posts={boardPosts}
                myVotes={myVotes}
              />
            </div>
          </>
        )}
      </div>
    );
  }

  const attendees = await db
    .select()
    .from(rsvps)
    .where(and(eq(rsvps.kind, "dinner"), eq(rsvps.refId, dinner.id)))
    .orderBy(desc(rsvps.createdAt));
  const headcount = attendees.reduce((sum, r) => sum + r.partySize, 0);
  const recentNames = attendees
    .map((r) => r.name)
    .filter((n): n is string => !!n);

  const dinnerProgram = program ?? (await getProgramById(dinner.programId));
  const permalink = `/dinner/${dinnerSlug(dinner, dinnerProgram)}`;

  return (
    <div
      data-brand={brand.brandKey}
      className="ds-page"
      style={{ position: "relative" }}
    >
      {/* looping video backdrop behind the hero only */}
      <section
        className="relative -mt-8 min-h-[70vh] overflow-hidden sm:-mt-10 sm:min-h-[520px]"
        style={{
          marginBottom: 8,
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
          width: "100vw",
        }}
      >
        <DinnerBackground />
        <div
          className="ds-wrap ds-dinner-hero-grid"
          style={{
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: "clamp(20px, 4vw, 40px)",
            alignItems: "center",
            // Vertical padding (which pushes the mobile copy below the logo
            // badge) lives in .ds-dinner-hero-grid so it can differ per
            // breakpoint; horizontal edge padding comes from .ds-wrap. Setting a
            // `padding` shorthand here would reset both to 0.
          }}
        >
          <Reveal>
            <h1
              style={{
                fontFamily: brand.displayFontVar,
                fontSize: "clamp(28px, 4.6vw, 48px)",
                color: "#fff",
                textShadow: "0 2px 18px rgba(0,0,0,.4)",
                margin: 0,
              }}
            >
              Pull up a chair — dinner&rsquo;s on us.
            </h1>
            <p
              style={{
                fontSize: "clamp(15px, 1.8vw, 18px)",
                maxWidth: 480,
                margin: "14px 0 0",
                color: "rgba(255,255,255,.92)",
              }}
            >
              Every Saturday, your host fires up the Ooni and makes pizza until
              people stop eating. Completely free — you&rsquo;re not expected to
              bring anything. Seen us on social? That invite means you.
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
                  color: "var(--brand-accent, #a8332a)",
                }}
              >
                🐶 Dog-friendly
              </span>
              <span
                className="ds-chip"
                style={{
                  background: "#fff",
                  color: "var(--brand-accent, #a8332a)",
                }}
              >
                💸 Always free
              </span>
            </div>
          </Reveal>

          <Reveal delay={1}>
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
                  Next dinner
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontFamily: brand.displayFontVar,
                    fontSize: "clamp(18px, 2.4vw, 24px)",
                  }}
                >
                  {dinner.title}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 14.5, opacity: 0.9 }}>
                  {formatDate(dinner.date)}
                  {dinner.startTime ? ` · ${formatTime(dinner.startTime)}` : ""}
                  {dinner.location ? ` · ${dinner.location}` : ""}
                  {dinner.capacity
                    ? ` · ${Math.max(0, dinner.capacity - headcount)} seats left`
                    : ""}
                </p>
              </div>
              <RsvpWidget
                kind="dinner"
                refId={dinner.id}
                initialHeadcount={headcount}
                recentNames={recentNames}
                prompt="Coming this Saturday?"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {dinner.description && (
        <p
          className="ds-wrap"
          style={{
            maxWidth: 640,
            margin: "0 auto",
            paddingTop: 10,
            paddingBottom: 10,
            textAlign: "center",
            color: "var(--ds-ink)",
            whiteSpace: "pre-line",
          }}
        >
          {dinner.description}
        </p>
      )}

      <p
        className="ds-wrap"
        style={{ textAlign: "center", paddingTop: 4, paddingBottom: 4 }}
      >
        <Link
          href={permalink}
          style={{
            color: `var(--brand-accent, ${brand.accent})`,
            fontWeight: 700,
            fontSize: 14.5,
            textDecoration: "none",
          }}
        >
          Details &amp; share this dinner →
        </Link>
      </p>

      {/* how it works */}
      <section
        className="ds-wrap"
        style={{ paddingTop: 20, paddingBottom: 40 }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: 14,
          }}
        >
          {HOW_IT_WORKS.map(([title, sub], i) => (
            <Reveal
              key={title}
              delay={i as 0 | 1 | 2}
              className="ds-card"
              style={{ padding: "18px 20px" }}
            >
              <h3
                style={{
                  fontFamily: brand.displayFontVar,
                  fontSize: 17,
                  color: `var(--brand-accent-deep, ${brand.accent})`,
                  margin: 0,
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 14.5,
                  color: "var(--ds-muted)",
                }}
              >
                {sub}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {programId && (
        <>
          <section className="ds-wrap" style={{ paddingBottom: 50 }}>
            <AlbumSection
              programId={programId}
              kind="dinner"
              albums={albumSection}
            />
          </section>
          <section className="ds-wrap" style={{ paddingBottom: 60 }}>
            <Board
              programId={programId}
              kind="dinner"
              posts={boardPosts}
              myVotes={myVotes}
            />
          </section>
        </>
      )}
    </div>
  );
}

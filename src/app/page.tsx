import type { Metadata } from "next";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { dinners, rides, trips, type Program } from "@/db/schema";
import { getActivePrograms } from "@/lib/programs";
import { formatDate } from "@/lib/utils";
import { brandForProgram, type BrandKey } from "@/lib/brands";
import { LandingPanel } from "@/components/LandingPanel";
import { DinnerPanel } from "@/components/DinnerPanel";
import type { PhotoData } from "@/components/Photo";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

const HOME_TITLE =
  "Sidewalk Story — Saturday dinners, Sunday rides & community trips in Philadelphia";
const HOME_DESCRIPTION =
  "A Philadelphia community hosting free Saturday dinners, Sunday bike rides with Nomadic Bike Philly, and community trips. Pick what's yours and RSVP.";

export function generateMetadata(): Metadata {
  // Bypass the layout's title template — the home title should read as the
  // full org phrase, not "<leaf> · Sidewalk Story".
  const meta = pageMetadata({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: "/",
  });
  return { ...meta, title: { absolute: HOME_TITLE } };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Real photos to drift on each non-dinner brand panel (trips has none yet — gradient placeholders fill in). */
const DRIFT_PHOTOS: Record<BrandKey, PhotoData[]> = {
  ss: [],
  nb: [
    {
      src: "/photos/ride-staging.jpg",
      cap: "Staging up on Mifflin St",
      brand: "nb",
    },
    {
      src: "/photos/ride-coffee.jpg",
      cap: "Coffee & sandwiches, The Landing",
      brand: "nb",
    },
    {
      src: "/photos/ride-fallen-tree.jpg",
      cap: "Storm blocked the trail",
      brand: "nb",
    },
  ],
  ft: [
    { cap: "Scouting the campsite", brand: "ft", hue: 110 },
    { cap: "Batona Trail walk", brand: "ft", hue: 130 },
    { cap: "Campfire planning", brand: "ft", hue: 95 },
  ],
};

/** "Warm" copy variant (KTD/plan: ship warm as the default, no copy-variant switcher). */
const LANDING_COPY: Record<
  Program["kind"],
  {
    defaultWhen: string;
    headline: string;
    sub: string;
    cta: string;
    panelBg: string;
  }
> = {
  dinner: {
    defaultWhen: "Every Saturday · 6 PM",
    headline: "Pizza night. Every Saturday. You’re invited.",
    sub: "Wood-fired pies from the Ooni, a long table, and whoever shows up. Free, always. Bring nothing but yourself.",
    cta: "See this Saturday",
    panelBg: "linear-gradient(160deg, #A8332A 0%, #7E241D 100%)",
  },
  ride: {
    defaultWhen: "Every Sunday · 10 AM",
    headline: "Slow miles, good coffee, Sunday mornings.",
    sub: "An easy 10 miles up the Schuylkill to Manayunk, coffee on Main Street, and 10 miles home. All bikes, all paces.",
    cta: "Join Sunday’s ride",
    panelBg: "linear-gradient(160deg, #1F3A63 0%, #14294A 100%)",
  },
  trip: {
    defaultWhen: "A few times a season",
    headline: "Sometimes we leave the sidewalk behind.",
    sub: "Camping in the Pine Barrens, waterfall hikes, day trips. Planned together, open to everyone, free unless we say otherwise.",
    cta: "See upcoming trips",
    panelBg: "linear-gradient(160deg, #2E5339 0%, #1F3B28 100%)",
  },
};

function programHref(p: Program): string {
  if (p.kind === "dinner") return `/dinner?program=${p.slug}`;
  if (p.kind === "ride") return `/rides?program=${p.slug}`;
  return `/trips?program=${p.slug}`;
}

/** Computed "next up" caption per program, reusing the existing next-event data reads. */
async function whenForProgram(p: Program): Promise<string | null> {
  const db = getDb();
  if (p.kind === "dinner") {
    const [d] = await db
      .select()
      .from(dinners)
      .where(
        and(
          eq(dinners.programId, p.id),
          eq(dinners.status, "published"),
          gte(dinners.date, today()),
        ),
      )
      .orderBy(asc(dinners.date))
      .limit(1);
    return d
      ? `${formatDate(d.date)}${d.startTime ? ` · ${d.startTime}` : ""}`
      : null;
  }
  if (p.kind === "ride") {
    const [r] = await db
      .select()
      .from(rides)
      .where(
        and(
          eq(rides.programId, p.id),
          eq(rides.status, "published"),
          gte(rides.date, today()),
        ),
      )
      .orderBy(asc(rides.date))
      .limit(1);
    return r
      ? `${formatDate(r.date)}${r.startTime ? ` · ${r.startTime}` : ""}`
      : null;
  }
  // trip
  const [t] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.programId, p.id), eq(trips.status, "published")))
    .orderBy(desc(trips.createdAt))
    .limit(1);
  if (!t) return null;
  return t.finalDate
    ? `Confirmed: ${formatDate(t.finalDate)}`
    : t.tentativeWindow || null;
}

export default async function Home() {
  const programs = await getActivePrograms();
  const panels = await Promise.all(
    programs.map(async (program) => ({
      program,
      brand: brandForProgram(program),
      when:
        (await whenForProgram(program)) ??
        LANDING_COPY[program.kind].defaultWhen,
      copy: LANDING_COPY[program.kind],
    })),
  );

  return (
    <div>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <header
        className="ds-wrap"
        style={{
          padding:
            "clamp(40px, 8vw, 90px) clamp(16px,4vw,40px) clamp(20px, 4vw, 44px)",
          textAlign: "center",
        }}
      >
        <p
          className="ds-chip"
          style={{ background: "rgba(43,33,24,.07)", marginBottom: 16 }}
        >
          South Philly · est. on a stoop
        </p>
        <h1
          style={{
            fontFamily: "var(--font-ft)",
            fontWeight: 800,
            fontSize: "clamp(34px, 6.4vw, 68px)",
            letterSpacing: "-.015em",
            color: "var(--ds-ink)",
            margin: 0,
          }}
        >
          One neighborhood.
          <br />
          Three ways to show up.
        </h1>
        <p
          style={{
            color: "var(--ds-muted)",
            fontSize: "clamp(16px, 1.9vw, 19px)",
            maxWidth: 560,
            margin: "16px auto 0",
          }}
        >
          Saturday dinners, Sunday rides, and the occasional trip out of town.
          No memberships, no fees, no experience needed.
        </p>
      </header>

      <div>
        {panels.map(({ program, brand, when, copy }) =>
          program.kind === "dinner" ? (
            <div
              key={program.id}
              className="relative left-1/2 right-1/2 -mx-[50vw] w-screen"
            >
              <DinnerPanel
                brand={brand}
                href={programHref(program)}
                when={when}
                headline={copy.headline}
                sub={copy.sub}
                cta={copy.cta}
              />
            </div>
          ) : (
            <div
              key={program.id}
              className="relative left-1/2 right-1/2 -mx-[50vw] w-screen"
            >
              <LandingPanel
                program={program}
                brand={brand}
                href={programHref(program)}
                when={when}
                headline={copy.headline}
                sub={copy.sub}
                cta={copy.cta}
                panelBg={copy.panelBg}
                photos={DRIFT_PHOTOS[brand.brandKey]}
              />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

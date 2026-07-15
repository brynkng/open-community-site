import Link from "next/link";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import { getDb } from "@/db";
import { dinners, rides, trips, type Program } from "@/db/schema";
import { getActivePrograms } from "@/lib/programs";
import { formatDate } from "@/lib/utils";
import { SubscribeForm } from "@/components/SubscribeForm";

export const dynamic = "force-dynamic";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

type Item = { href: string; title: string; sub: string };

/** Fetch the next few things to show for a program's homepage section. */
async function itemsForProgram(p: Program): Promise<{ items: Item[]; cta: { href: string; label: string } }> {
  const db = getDb();
  if (p.kind === "dinner") {
    const [d] = await db
      .select()
      .from(dinners)
      .where(and(eq(dinners.programId, p.id), eq(dinners.status, "published"), gte(dinners.date, today())))
      .orderBy(asc(dinners.date))
      .limit(1);
    const items = d
      ? [{ href: `/dinner?program=${p.slug}`, title: d.title, sub: `${formatDate(d.date)}${d.startTime ? ` · ${d.startTime}` : ""}` }]
      : [];
    return { items, cta: { href: `/dinner?program=${p.slug}`, label: "RSVP for dinner" } };
  }
  if (p.kind === "ride") {
    const list = await db
      .select()
      .from(rides)
      .where(and(eq(rides.programId, p.id), eq(rides.status, "published"), gte(rides.date, today())))
      .orderBy(asc(rides.date))
      .limit(3);
    return {
      items: list.map((r) => ({
        href: `/rides/${r.slug}`,
        title: r.title,
        sub: `${formatDate(r.date)}${r.startTime ? ` · ${r.startTime}` : ""}${r.distanceKm ? ` · ${r.distanceKm} km` : ""}`,
      })),
      cta: { href: `/rides?program=${p.slug}`, label: "See all rides" },
    };
  }
  // trip
  const list = await db
    .select()
    .from(trips)
    .where(and(eq(trips.programId, p.id), eq(trips.status, "published")))
    .orderBy(desc(trips.createdAt))
    .limit(3);
  return {
    items: list.map((t) => ({
      href: `/trips/${t.slug}`,
      title: t.title,
      sub: t.finalDate ? `Confirmed: ${formatDate(t.finalDate)}` : t.tentativeWindow || "Date TBD",
    })),
    cta: { href: `/trips?program=${p.slug}`, label: "See trips" },
  };
}

export default async function Home() {
  const programs = await getActivePrograms();
  const sections = await Promise.all(
    programs.map(async (p) => ({ program: p, ...(await itemsForProgram(p)) })),
  );

  return (
    <div className="space-y-14">
      <section className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          One community, many ways to show up.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-600">
          Free Saturday dinners, Sunday rides with Nomadic Bike Philly, and bigger trips we plan together.
          Pick what&apos;s yours and RSVP.
        </p>
      </section>

      {sections.map(({ program, items, cta }) => (
        <section
          key={program.id}
          className="overflow-hidden rounded-3xl border bg-white"
          style={{ borderColor: `${program.accentColor}33` }}
        >
          <div
            className="flex items-center gap-4 p-6"
            style={{ background: `linear-gradient(180deg, ${program.accentColor}14, transparent)` }}
          >
            {program.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={program.logoUrl} alt={program.name} className="h-16 w-16 rounded-full object-cover ring-2" style={{ boxShadow: `0 0 0 2px ${program.accentColor}` }} />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white" style={{ backgroundColor: program.accentColor }}>
                {program.name.slice(0, 1)}
              </span>
            )}
            <div>
              <h2 className="text-2xl font-extrabold" style={{ color: program.accentColor }}>{program.name}</h2>
              {program.tagline && <p className="text-sm text-stone-600">{program.tagline}</p>}
            </div>
          </div>

          <div className="space-y-3 px-6 pb-6">
            {items.length === 0 ? (
              <p className="text-sm text-stone-500">Nothing scheduled yet — check back soon.</p>
            ) : (
              items.map((it) => (
                <Link key={it.href + it.title} href={it.href} className="flex items-center justify-between rounded-xl border border-black/5 px-4 py-3 transition hover:bg-stone-50">
                  <div>
                    <p className="font-semibold">{it.title}</p>
                    <p className="text-sm text-stone-500">{it.sub}</p>
                  </div>
                  <span aria-hidden style={{ color: program.accentColor }}>→</span>
                </Link>
              ))
            )}
            <Link
              href={cta.href}
              className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white transition"
              style={{ backgroundColor: program.accentColor }}
            >
              {cta.label}
            </Link>
          </div>
        </section>
      ))}

      <section id="newsletter" className="card mx-auto max-w-xl">
        <h2 className="text-xl font-bold">Get the newsletter</h2>
        <p className="mt-1 text-sm text-stone-600">
          Occasional emails about upcoming dinners, rides, and bigger trips. No spam, unsubscribe anytime.
        </p>
        <div className="mt-4">
          <SubscribeForm />
        </div>
      </section>
    </div>
  );
}

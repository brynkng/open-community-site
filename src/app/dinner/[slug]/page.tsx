import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { rsvps } from "@/db/schema";
import { formatDate, formatTime } from "@/lib/utils";
import { RsvpForm } from "@/components/RsvpForm";
import { ProgramBadge } from "@/components/ProgramBadge";
import { JsonLd } from "@/components/JsonLd";
import { findDinnerBySlug } from "@/lib/dinner-permalink";
import {
  pageMetadata,
  ogImageForProgram,
  absoluteUrl,
  eventJsonLd,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = await findDinnerBySlug(slug);
  if (!found) {
    // notFound() in the page component governs the 404; return a minimal
    // default here so generateMetadata never throws.
    return pageMetadata({
      title: "Dinner",
      description: "Saturday community dinner.",
      path: `/dinner/${slug}`,
      kind: "dinner",
    });
  }
  const { dinner, program } = found;
  const title = `${dinner.title} — ${formatDate(dinner.date)}`;
  const description =
    dinner.description ||
    `Free Saturday community dinner${dinner.location ? ` at ${dinner.location}` : ""} on ${formatDate(dinner.date)}. Everyone is welcome.`;
  return pageMetadata({
    title,
    description,
    path: `/dinner/${slug}`,
    imagePath: ogImageForProgram(program),
  });
}

export default async function DinnerDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const found = await findDinnerBySlug(slug);
  if (!found) notFound();
  const { dinner, program } = found;

  const db = getDb();
  const attendees = await db
    .select()
    .from(rsvps)
    .where(and(eq(rsvps.kind, "dinner"), eq(rsvps.refId, dinner.id)));
  const headcount = attendees.reduce((sum, r) => sum + r.partySize, 0);

  const image = absoluteUrl(ogImageForProgram(program));

  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <JsonLd
        data={eventJsonLd({
          name: dinner.title,
          startDate: dinner.startTime
            ? `${dinner.date}T${dinner.startTime}`
            : dinner.date,
          description: dinner.description,
          location: dinner.location,
          status: dinner.status,
          isAccessibleForFree: true,
          includeFreeOffer: true,
          image,
        })}
      />

      <header>
        <div className="mb-2">
          <ProgramBadge program={program} />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          {formatDate(dinner.date)}
          {dinner.startTime ? ` · ${formatTime(dinner.startTime)}` : ""}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">{dinner.title}</h1>
        {dinner.status === "cancelled" && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            This dinner has been cancelled.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-stone-600">
          {dinner.location && (
            <span className="rounded-full bg-stone-100 px-3 py-1">
              📍 {dinner.location}
            </span>
          )}
          <span className="rounded-full bg-brand-light/50 px-3 py-1 text-brand-dark">
            {headcount} {headcount === 1 ? "person" : "people"} coming
          </span>
          {dinner.capacity ? (
            <span className="rounded-full bg-stone-100 px-3 py-1">
              {Math.max(0, dinner.capacity - headcount)} seats left
            </span>
          ) : null}
        </div>
      </header>

      {dinner.description && (
        <div className="whitespace-pre-line leading-relaxed text-stone-700">
          {dinner.description}
        </div>
      )}

      {dinner.status !== "cancelled" && (
        <div className="card">
          <h2 className="mb-4 text-lg font-bold">RSVP</h2>
          <RsvpForm kind="dinner" refId={dinner.id} />
        </div>
      )}
    </article>
  );
}

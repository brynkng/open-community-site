import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { rides, rsvps } from "@/db/schema";
import { env } from "@/lib/env";
import { formatDate, formatTime, kmToMiles } from "@/lib/utils";
import { getProgramById } from "@/lib/programs";
import { RsvpForm } from "@/components/RsvpForm";
import { ProgramBadge } from "@/components/ProgramBadge";
import { JsonLd } from "@/components/JsonLd";
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
  const db = getDb();
  const [ride] = await db
    .select()
    .from(rides)
    .where(eq(rides.slug, slug))
    .limit(1);
  if (!ride || ride.status === "draft") {
    // notFound() in the page component governs the 404; return a minimal
    // default here so generateMetadata never throws.
    return pageMetadata({
      title: "Ride",
      description: "Sunday bike ride.",
      path: `/rides/${slug}`,
      kind: "ride",
    });
  }
  const program = await getProgramById(ride.programId);
  const title = `${ride.title} — ${formatDate(ride.date)}`;
  const description =
    ride.description ||
    `Sunday bike ride${ride.meetLocation ? ` from ${ride.meetLocation}` : ""} on ${formatDate(ride.date)}.`;
  // Prefer the ride's own R2 cover image when set, else the kind fallback.
  const imageUrl = ride.imageKey
    ? `${env().R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${ride.imageKey}`
    : absoluteUrl(ogImageForProgram(program));
  return pageMetadata({ title, description, path: `/rides/${slug}`, imageUrl });
}

export default async function RideDetail({ params }: { params: Params }) {
  const { slug } = await params;
  const db = getDb();
  const [ride] = await db
    .select()
    .from(rides)
    .where(eq(rides.slug, slug))
    .limit(1);
  if (!ride || ride.status === "draft") notFound();

  const program = await getProgramById(ride.programId);

  const attendees = await db
    .select()
    .from(rsvps)
    .where(and(eq(rsvps.kind, "ride"), eq(rsvps.refId, ride.id)));
  const headcount = attendees.reduce((sum, r) => sum + r.partySize, 0);

  const img = ride.imageKey
    ? `${env().R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${ride.imageKey}`
    : null;

  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <JsonLd
        data={eventJsonLd({
          name: ride.title,
          startDate: ride.startTime
            ? `${ride.date}T${ride.startTime}`
            : ride.date,
          description: ride.description,
          location: ride.meetLocation,
          status: ride.status,
          isAccessibleForFree: true,
          image: img ?? absoluteUrl(ogImageForProgram(program)),
        })}
      />

      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={ride.title}
          className="h-64 w-full rounded-2xl object-cover"
        />
      )}

      <header>
        <div className="mb-2">
          <ProgramBadge program={program} />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">
          {formatDate(ride.date)}
          {ride.startTime ? ` · roll out ${formatTime(ride.startTime)}` : ""}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold">{ride.title}</h1>
        {ride.status === "cancelled" && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            This ride has been cancelled.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2 text-sm text-stone-600">
          {ride.meetLocation && (
            <span className="rounded-full bg-stone-100 px-3 py-1">
              📍 {ride.meetLocation}
            </span>
          )}
          {ride.distanceKm ? (
            <span className="rounded-full bg-stone-100 px-3 py-1">
              {kmToMiles(ride.distanceKm)} mi
            </span>
          ) : null}
          {ride.paceLevel && (
            <span className="rounded-full bg-stone-100 px-3 py-1 capitalize">
              {ride.paceLevel} pace
            </span>
          )}
          <span className="rounded-full bg-brand-light/50 px-3 py-1 text-brand-dark">
            {headcount} riding
          </span>
        </div>
      </header>

      {ride.description && (
        <div className="whitespace-pre-line leading-relaxed text-stone-700">
          {ride.description}
        </div>
      )}

      {ride.routeUrl && (
        <a
          href={ride.routeUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
        >
          View the route ↗
        </a>
      )}

      {ride.status !== "cancelled" && (
        <div className="card">
          <h2 className="mb-4 text-lg font-bold">RSVP for this ride</h2>
          <RsvpForm kind="ride" refId={ride.id} />
        </div>
      )}
    </article>
  );
}

import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { dinners, rides, trips } from "@/db/schema";
import { getAllPrograms } from "@/lib/programs";
import { dinnerSlug } from "@/lib/dinner-permalink";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const STATIC_ROUTES = ["/", "/dinner", "/rides", "/trips"];

/**
 * Queries D1 for published events and maps them to sitemap entries. Wrapped
 * in try/catch by the caller (mirrors safePrograms() in layout.tsx) so a
 * failed DB read degrades to just the static routes rather than 500ing.
 */
async function publishedEventEntries(): Promise<MetadataRoute.Sitemap> {
  const db = getDb();
  const programs = await getAllPrograms();
  const programById = new Map(programs.map((p) => [p.id, p]));

  const [publishedDinners, publishedRides, publishedTrips] = await Promise.all([
    db.select().from(dinners).where(eq(dinners.status, "published")),
    db.select().from(rides).where(eq(rides.status, "published")),
    db.select().from(trips).where(eq(trips.status, "published")),
  ]);

  const dinnerEntries: MetadataRoute.Sitemap = publishedDinners.map((d) => ({
    url: absoluteUrl(`/dinner/${dinnerSlug(d, d.programId ? (programById.get(d.programId) ?? null) : null)}`),
    lastModified: d.createdAt,
  }));

  const rideEntries: MetadataRoute.Sitemap = publishedRides.map((r) => ({
    url: absoluteUrl(`/rides/${r.slug}`),
    lastModified: r.createdAt,
  }));

  const tripEntries: MetadataRoute.Sitemap = publishedTrips.map((t) => ({
    url: absoluteUrl(`/trips/${t.slug}`),
    lastModified: t.createdAt,
  }));

  return [...dinnerEntries, ...rideEntries, ...tripEntries];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date(),
  }));

  try {
    const eventEntries = await publishedEventEntries();
    return [...staticEntries, ...eventEntries];
  } catch {
    // D1 unreachable / build-time evaluation — degrade to static routes only.
    return staticEntries;
  }
}

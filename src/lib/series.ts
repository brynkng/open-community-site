import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { eventSeries, dinners, rides, type EventSeries } from "@/db/schema";
import { slugify, randomToken } from "@/lib/utils";

/** Today as an ISO date (YYYY-MM-DD), UTC — matches the rest of the app. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The next `count` dates (ISO) that land on `weekday` (0=Sun … 6=Sat), starting
 * from `fromISO` inclusive. If today already is that weekday, today is first.
 */
export function upcomingWeekdayDates(
  weekday: number,
  count: number,
  fromISO: string,
): string[] {
  const start = new Date(fromISO + "T00:00:00Z");
  const delta = (weekday - start.getUTCDay() + 7) % 7;
  const d = new Date(start);
  d.setUTCDate(d.getUTCDate() + delta);
  const dates: string[] = [];
  for (let i = 0; i < count; i++) {
    dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return dates;
}

type Db = ReturnType<typeof getDb>;

/**
 * Ensure a single series has its next `horizonWeeks` instances materialized.
 * Idempotent: only inserts dates that don't already have an instance for this
 * series. Returns the number of new instances created.
 */
export async function materializeOne(
  db: Db,
  series: EventSeries,
  fromISO = todayISO(),
): Promise<number> {
  if (!series.active) return 0;
  const wanted = upcomingWeekdayDates(
    series.weekday,
    series.horizonWeeks,
    fromISO,
  );
  if (wanted.length === 0) return 0;

  const table = series.kind === "dinner" ? dinners : rides;
  const existing = await db
    .select({ date: table.date })
    .from(table)
    .where(and(eq(table.seriesId, series.id), inArray(table.date, wanted)));
  const have = new Set(existing.map((r) => r.date));
  const missing = wanted.filter((date) => !have.has(date));
  if (missing.length === 0) return 0;

  if (series.kind === "dinner") {
    await db.insert(dinners).values(
      missing.map((date) => ({
        programId: series.programId,
        seriesId: series.id,
        date,
        title: series.title,
        description: series.description,
        location: series.location,
        startTime: series.startTime,
        capacity: series.capacity,
      })),
    );
  } else {
    await db.insert(rides).values(
      missing.map((date) => ({
        programId: series.programId,
        seriesId: series.id,
        slug: `${slugify(series.title)}-${date}-${randomToken(2)}`,
        title: series.title,
        date,
        startTime: series.startTime,
        meetLocation: series.location,
        distanceKm: series.distanceKm,
        paceLevel: series.paceLevel,
        routeUrl: series.routeUrl,
        description: series.description,
        imageKey: series.imageKey,
      })),
    );
  }
  return missing.length;
}

/**
 * Materialize every active series. Called by the daily cron and once right after
 * a series is created (so instances appear immediately). Returns the total
 * number of new instances created.
 */
export async function materializeAll(fromISO = todayISO()): Promise<number> {
  const db = getDb();
  const active = await db
    .select()
    .from(eventSeries)
    .where(eq(eventSeries.active, true));
  let created = 0;
  for (const series of active) {
    created += await materializeOne(db, series, fromISO);
  }
  return created;
}

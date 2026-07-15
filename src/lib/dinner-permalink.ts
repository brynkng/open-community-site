import { and, asc, eq, isNull, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { dinners, type Dinner, type Program } from "@/db/schema";
import { getProgramBySlug } from "@/lib/programs";

/** Fallback program slug used when a dinner has no programId (Q3). */
const FALLBACK_PROGRAM_SLUG = "saturday-dinner";

/**
 * Builds the composite `<date>-<program-slug>` permalink slug for a dinner,
 * e.g. "2026-07-19-saturday-dinner". Falls back to a fixed program slug for
 * program-less dinners so the slug is always resolvable.
 */
export function dinnerSlug(dinner: Pick<Dinner, "date">, program: Pick<Program, "slug"> | null): string {
  return `${dinner.date}-${program?.slug ?? FALLBACK_PROGRAM_SLUG}`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reverse lookup: parses a permalink slug back into (date, program slug),
 * loads the matching program, and queries for a matching non-draft dinner.
 *
 * Parsing rule: date = first 10 chars (YYYY-MM-DD), program slug = remainder
 * after the separating "-". This holds even when the program slug itself
 * contains hyphens (e.g. "saturday-dinner"), since only the first 10 chars
 * are ever treated as the date.
 */
export async function findDinnerBySlug(slug: string): Promise<{ dinner: Dinner; program: Program | null } | null> {
  if (slug.length < 12) return null; // 10-char date + "-" + at least 1 char slug

  const date = slug.slice(0, 10);
  const progSlug = slug.slice(11); // skip the separating "-" at index 10

  if (!DATE_RE.test(date) || !progSlug) return null;

  const program = await getProgramBySlug(progSlug);

  const db = getDb();
  const programFilter = program !== null ? eq(dinners.programId, program.id) : isNull(dinners.programId);

  const rows = await db
    .select()
    .from(dinners)
    .where(and(eq(dinners.date, date), programFilter, ne(dinners.status, "draft")))
    .orderBy(asc(dinners.id))
    .limit(1);

  const dinner = rows[0];
  if (!dinner) return null;

  return { dinner, program };
}

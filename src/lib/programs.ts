import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { programs, type Program } from "@/db/schema";

export async function getActivePrograms(): Promise<Program[]> {
  return getDb()
    .select()
    .from(programs)
    .where(eq(programs.active, true))
    .orderBy(asc(programs.sortOrder), asc(programs.id));
}

export async function getAllPrograms(): Promise<Program[]> {
  return getDb().select().from(programs).orderBy(asc(programs.sortOrder), asc(programs.id));
}

export async function getProgramsByKind(kind: "dinner" | "ride" | "trip"): Promise<Program[]> {
  return getDb()
    .select()
    .from(programs)
    .where(and(eq(programs.kind, kind), eq(programs.active, true)))
    .orderBy(asc(programs.sortOrder), asc(programs.id));
}

export async function getProgramById(id: number | null): Promise<Program | null> {
  if (!id) return null;
  const [p] = await getDb().select().from(programs).where(eq(programs.id, id)).limit(1);
  return p ?? null;
}

export async function getProgramBySlug(slug: string): Promise<Program | null> {
  const [p] = await getDb().select().from(programs).where(eq(programs.slug, slug)).limit(1);
  return p ?? null;
}

/** First active program of a kind — used as the default when creating events. */
export async function defaultProgramIdForKind(kind: "dinner" | "ride" | "trip"): Promise<number | null> {
  const list = await getProgramsByKind(kind);
  return list[0]?.id ?? null;
}

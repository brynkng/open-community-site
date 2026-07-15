import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { albums, albumPhotos, type Album, type AlbumPhoto } from "@/db/schema";

/** All non-hidden albums for a program, main album first. */
export async function getAlbums(programId: number | null): Promise<Album[]> {
  if (!programId) return [];
  return getDb()
    .select()
    .from(albums)
    .where(and(eq(albums.programId, programId), eq(albums.hidden, false)))
    .orderBy(desc(albums.main), asc(albums.sortOrder), asc(albums.id));
}

/** The featured/default album for a program, if any. */
export async function getMainAlbum(
  programId: number | null,
): Promise<Album | null> {
  const list = await getAlbums(programId);
  return list.find((a) => a.main) ?? list[0] ?? null;
}

/** All non-hidden photos in an album, newest first. */
export async function getAlbumPhotos(albumId: number): Promise<AlbumPhoto[]> {
  return getDb()
    .select()
    .from(albumPhotos)
    .where(and(eq(albumPhotos.albumId, albumId), eq(albumPhotos.hidden, false)))
    .orderBy(desc(albumPhotos.takenDate), desc(albumPhotos.id));
}

export type PhotoGroup = { date: string; photos: AlbumPhoto[] };

/**
 * Groups an album's photos by `takenDate` (falling back to the upload day for
 * photos with no date), newest group first, for the date-grouped display.
 */
export async function getGroupedAlbumPhotos(
  albumId: number,
): Promise<PhotoGroup[]> {
  const photos = await getAlbumPhotos(albumId);
  const groups = new Map<string, AlbumPhoto[]>();
  for (const photo of photos) {
    const date = photo.takenDate || photo.createdAt.toISOString().slice(0, 10);
    const existing = groups.get(date);
    if (existing) existing.push(photo);
    else groups.set(date, [photo]);
  }
  return Array.from(groups.entries())
    .map(([date, photos]) => ({ date, photos }))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

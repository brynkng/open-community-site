import { and, eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { boardVotes } from "@/db/schema";
import { getAlbums, getGroupedAlbumPhotos } from "@/lib/albums";
import { getPosts, getComments } from "@/lib/board";
import { env } from "@/lib/env";
import type { BrandKey } from "@/lib/brands";
import type { AlbumWithPhotos } from "@/components/AlbumSection";
import type { PostWithComments } from "@/components/Board";

const VOTER_COOKIE = "voter_key";

/**
 * Server-side data loader shared by the dinner/rides/trips section pages
 * (U3/U6): resolves a program's non-hidden albums (with R2 image URLs and
 * date-grouped photos) and board posts (with comments), plus the current
 * request's own votes on those posts — read directly from `board_votes` here
 * (rather than adding a new export to `src/lib/board.ts`, which is backend
 * code owned by the U4/U5 slice) using the same `voter_key` cookie
 * `src/app/community/actions.ts` issues. Best-effort only: an absent/garbled
 * cookie just means no votes are pre-highlighted.
 */
export async function loadCommunitySections(
  programId: number | null,
  brandKey: BrandKey,
): Promise<{
  albumSection: AlbumWithPhotos[];
  boardPosts: PostWithComments[];
  myVotes: Record<number, 1 | -1>;
}> {
  if (!programId) return { albumSection: [], boardPosts: [], myVotes: {} };

  const [rawAlbums, rawPosts] = await Promise.all([
    getAlbums(programId),
    getPosts(programId),
  ]);
  const r2Base = env().R2_PUBLIC_BASE_URL.replace(/\/$/, "");

  const albumSection: AlbumWithPhotos[] = await Promise.all(
    rawAlbums.map(async (album) => {
      const groups = await getGroupedAlbumPhotos(album.id);
      return {
        album,
        groups: groups.map((g) => ({
          date: g.date,
          photos: g.photos.map((p) => ({
            id: p.id,
            src: `${r2Base}/${p.imageKey}`,
            cap: p.caption ?? undefined,
            brand: brandKey,
          })),
        })),
      };
    }),
  );

  const boardPosts: PostWithComments[] = await Promise.all(
    rawPosts.map(async (post) => ({
      post,
      comments: await getComments(post.id),
    })),
  );

  let myVotes: Record<number, 1 | -1> = {};
  const voterKey = (await cookies()).get(VOTER_COOKIE)?.value;
  if (voterKey && rawPosts.length) {
    const votes = await getDb()
      .select()
      .from(boardVotes)
      .where(
        and(
          eq(boardVotes.voterKey, voterKey),
          inArray(
            boardVotes.postId,
            rawPosts.map((p) => p.id),
          ),
        ),
      );
    myVotes = Object.fromEntries(votes.map((v) => [v.postId, v.dir as 1 | -1]));
  }

  return { albumSection, boardPosts, myVotes };
}

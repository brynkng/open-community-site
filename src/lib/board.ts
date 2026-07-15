import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  boardPosts,
  boardComments,
  tripComments,
  type BoardPost,
  type BoardComment,
  type TripComment,
} from "@/db/schema";

/** Non-hidden board posts for a program, highest-voted then newest first. */
export async function getPosts(programId: number | null): Promise<BoardPost[]> {
  if (!programId) return [];
  return getDb()
    .select()
    .from(boardPosts)
    .where(
      and(eq(boardPosts.programId, programId), eq(boardPosts.hidden, false)),
    )
    .orderBy(desc(boardPosts.voteScore), desc(boardPosts.createdAt));
}

/** Non-hidden comments on a board post, oldest first. */
export async function getComments(postId: number): Promise<BoardComment[]> {
  return getDb()
    .select()
    .from(boardComments)
    .where(
      and(eq(boardComments.postId, postId), eq(boardComments.hidden, false)),
    )
    .orderBy(asc(boardComments.createdAt));
}

/** Non-hidden "Trip talk" comments on a trip, oldest first. */
export async function getTripComments(tripId: number): Promise<TripComment[]> {
  return getDb()
    .select()
    .from(tripComments)
    .where(and(eq(tripComments.tripId, tripId), eq(tripComments.hidden, false)))
    .orderBy(asc(tripComments.createdAt));
}

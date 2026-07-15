"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  albums,
  albumPhotos,
  boardPosts,
  boardComments,
  boardVotes,
  tripComments,
  trips,
  type Program,
} from "@/db/schema";
import { verifyTurnstile } from "@/lib/turnstile";
import { checkRate } from "@/lib/ratelimit";
import { getProgramById } from "@/lib/programs";
import { randomToken } from "@/lib/utils";
import { env } from "@/lib/env";

export type FormState = { ok: boolean; message: string } | null;

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB, matches the admin upload cap

/** Section path for a program's public page, used to revalidate after a write. */
function pathForProgram(program: Program | null): string {
  if (!program) return "/";
  switch (program.kind) {
    case "dinner":
      return "/dinner";
    case "ride":
      return "/rides";
    case "trip":
      return "/trips";
    default:
      return "/";
  }
}

async function verifyWrite(formData: FormData): Promise<string | null> {
  const token = String(formData.get("cf-turnstile-response") || "") || null;
  const verified = await verifyTurnstile(token);
  if (!verified) return "Verification failed — please try again.";
  return null;
}

// ==========================================================================
// Photo albums (R1)
// ==========================================================================

/** Create a new album under a program. */
export async function createAlbumAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const turnstileError = await verifyWrite(formData);
  if (turnstileError) return { ok: false, message: turnstileError };
  if (!(await checkRate("createAlbum")))
    return { ok: false, message: "Too many attempts — please slow down." };

  const programId = Number(formData.get("programId")) || null;
  const name = String(formData.get("name") || "").trim();
  if (!programId) return { ok: false, message: "Missing program." };
  if (!name) return { ok: false, message: "Album name is required." };

  const program = await getProgramById(programId);
  if (!program) return { ok: false, message: "That program no longer exists." };

  await getDb().insert(albums).values({ programId, name });

  revalidatePath(pathForProgram(program));
  return { ok: true, message: `Album "${name}" created.` };
}

/**
 * Anonymous photo upload: validates the image, writes it to R2 under
 * `community/<program-slug>/<album-id>/<random>.<ext>`, and records the row.
 */
export async function uploadPhotoAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const turnstileError = await verifyWrite(formData);
  if (turnstileError) return { ok: false, message: turnstileError };
  if (!(await checkRate("upload")))
    return { ok: false, message: "Too many uploads — please slow down." };

  const albumId = Number(formData.get("albumId"));
  if (!albumId) return { ok: false, message: "Missing album." };

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, message: "Choose a photo to upload." };
  if (!file.type.startsWith("image/"))
    return { ok: false, message: "Only image files are allowed." };
  if (file.size > MAX_UPLOAD_BYTES)
    return { ok: false, message: "Image must be under 8 MB." };

  const db = getDb();
  const [album] = await db
    .select()
    .from(albums)
    .where(and(eq(albums.id, albumId), eq(albums.hidden, false)))
    .limit(1);
  if (!album) return { ok: false, message: "That album no longer exists." };

  const program = await getProgramById(album.programId);
  const programSlug = program?.slug || "general";

  const ext = file.type.includes("png")
    ? "png"
    : file.type.includes("webp")
      ? "webp"
      : file.type.includes("gif")
        ? "gif"
        : "jpg";
  const base = `community/${programSlug}/${albumId}/${randomToken(8)}`;
  const imageKey = `${base}.${ext}`;

  // ── R2 STORAGE SEAM ──────────────────────────────────────────────────────
  // This is the single point where a community photo is persisted to storage.
  // The client sends a resized `photo` (full, capped) plus an optional `thumb`
  // (grid thumbnail); we store both so the grid loads small images and the
  // viewer loads the full one. Keep `imageKey`/`thumbKey` as the stored object
  // keys so album_photos + R2_PUBLIC_BASE_URL and the admin delete path
  // (deleteContentAction) stay consistent.
  await env().MEDIA.put(imageKey, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || "image/jpeg" },
  });

  let thumbKey: string | null = null;
  const thumb = formData.get("thumb");
  if (
    thumb instanceof File &&
    thumb.size > 0 &&
    thumb.type.startsWith("image/")
  ) {
    thumbKey = `${base}-t.jpg`;
    await env().MEDIA.put(thumbKey, await thumb.arrayBuffer(), {
      httpMetadata: { contentType: "image/jpeg" },
    });
  }

  const takenDate = String(formData.get("takenDate") || "").trim() || null;
  const caption = String(formData.get("caption") || "").trim() || null;

  await db.insert(albumPhotos).values({
    albumId,
    imageKey,
    thumbKey,
    takenDate,
    caption,
  });

  revalidatePath(pathForProgram(program));
  return { ok: true, message: "Photo uploaded — thanks for sharing!" };
}

// ==========================================================================
// Community board (R2)
// ==========================================================================

const DEFAULT_AUTHOR = "Neighbor";

/** Create a new board post under a program. */
export async function createPostAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const turnstileError = await verifyWrite(formData);
  if (turnstileError) return { ok: false, message: turnstileError };
  if (!(await checkRate("createPost")))
    return { ok: false, message: "Too many posts — please slow down." };

  const programId = Number(formData.get("programId")) || null;
  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim() || null;
  const authorName =
    String(formData.get("authorName") || "").trim() || DEFAULT_AUTHOR;

  if (!programId) return { ok: false, message: "Missing program." };
  if (!title) return { ok: false, message: "Give your post a title." };

  const program = await getProgramById(programId);
  if (!program) return { ok: false, message: "That program no longer exists." };

  await getDb()
    .insert(boardPosts)
    .values({ programId, title, body, authorName });

  revalidatePath(pathForProgram(program));
  return { ok: true, message: "Post added to the board." };
}

/** Comment on a board post. */
export async function addCommentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const turnstileError = await verifyWrite(formData);
  if (turnstileError) return { ok: false, message: turnstileError };
  if (!(await checkRate("comment")))
    return { ok: false, message: "Too many comments — please slow down." };

  const postId = Number(formData.get("postId"));
  const text = String(formData.get("text") || "").trim();
  const authorName =
    String(formData.get("authorName") || "").trim() || DEFAULT_AUTHOR;

  if (!postId) return { ok: false, message: "Missing post." };
  if (!text) return { ok: false, message: "Comment can't be empty." };

  const db = getDb();
  const [post] = await db
    .select()
    .from(boardPosts)
    .where(and(eq(boardPosts.id, postId), eq(boardPosts.hidden, false)))
    .limit(1);
  if (!post) return { ok: false, message: "That post no longer exists." };

  await db.insert(boardComments).values({ postId, authorName, text });

  const program = await getProgramById(post.programId);
  revalidatePath(pathForProgram(program));
  return { ok: true, message: "Comment added." };
}

const VOTER_COOKIE = "voter_key";
const VOTER_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2; // ~2 years

/** Returns the current request's voter key, issuing a fresh cookie if absent. */
async function getOrCreateVoterKey(): Promise<string> {
  const store = await cookies();
  const existing = store.get(VOTER_COOKIE)?.value;
  if (existing) return existing;

  const key = randomToken(16);
  store.set(VOTER_COOKIE, key, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: VOTER_COOKIE_MAX_AGE,
  });
  return key;
}

/**
 * Cast, change, or clear a vote on a board post. `dir` is `"1"` (up), `"-1"`
 * (down), or `"0"` (clear). Dedupe is via the `board_votes` UNIQUE(post_id,
 * voter_key) index and a long-lived, httpOnly `voter_key` cookie (KTD3) —
 * best-effort, not identity: clearing cookies allows re-voting.
 */
export async function voteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const turnstileError = await verifyWrite(formData);
  if (turnstileError) return { ok: false, message: turnstileError };
  if (!(await checkRate("vote")))
    return { ok: false, message: "Too many votes — please slow down." };

  const postId = Number(formData.get("postId"));
  const dirRaw = Number(formData.get("dir"));
  if (!postId) return { ok: false, message: "Missing post." };
  if (![1, -1, 0].includes(dirRaw))
    return { ok: false, message: "Invalid vote." };

  const db = getDb();
  const [post] = await db
    .select()
    .from(boardPosts)
    .where(and(eq(boardPosts.id, postId), eq(boardPosts.hidden, false)))
    .limit(1);
  if (!post) return { ok: false, message: "That post no longer exists." };

  const voterKey = await getOrCreateVoterKey();
  const [existing] = await db
    .select()
    .from(boardVotes)
    .where(
      and(eq(boardVotes.postId, postId), eq(boardVotes.voterKey, voterKey)),
    )
    .limit(1);

  if (!existing) {
    if (dirRaw === 0) return { ok: true, message: "No vote to clear." };
    await db.insert(boardVotes).values({ postId, voterKey, dir: dirRaw });
    await db
      .update(boardPosts)
      .set({ voteScore: post.voteScore + dirRaw })
      .where(eq(boardPosts.id, postId));
    const program = await getProgramById(post.programId);
    revalidatePath(pathForProgram(program));
    return { ok: true, message: "Vote recorded." };
  }

  if (existing.dir === dirRaw) {
    // Same direction again — no-op, matches the "re-voting is idempotent" contract.
    return { ok: true, message: "Vote unchanged." };
  }

  if (dirRaw === 0) {
    await db.delete(boardVotes).where(eq(boardVotes.id, existing.id));
    await db
      .update(boardPosts)
      .set({ voteScore: post.voteScore - existing.dir })
      .where(eq(boardPosts.id, postId));
    const program = await getProgramById(post.programId);
    revalidatePath(pathForProgram(program));
    return { ok: true, message: "Vote cleared." };
  }

  await db
    .update(boardVotes)
    .set({ dir: dirRaw })
    .where(eq(boardVotes.id, existing.id));
  await db
    .update(boardPosts)
    .set({ voteScore: post.voteScore - existing.dir + dirRaw })
    .where(eq(boardPosts.id, postId));
  const program = await getProgramById(post.programId);
  revalidatePath(pathForProgram(program));
  return { ok: true, message: "Vote changed." };
}

// ==========================================================================
// Trip talk (R3)
// ==========================================================================

/** Add a "Trip talk" comment to a trip. */
export async function addTripCommentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const turnstileError = await verifyWrite(formData);
  if (turnstileError) return { ok: false, message: turnstileError };
  if (!(await checkRate("tripComment")))
    return { ok: false, message: "Too many comments — please slow down." };

  const tripId = Number(formData.get("tripId"));
  const text = String(formData.get("text") || "").trim();
  const authorName =
    String(formData.get("authorName") || "").trim() || DEFAULT_AUTHOR;

  if (!tripId) return { ok: false, message: "Missing trip." };
  if (!text) return { ok: false, message: "Comment can't be empty." };

  const db = getDb();
  const [trip] = await db
    .select()
    .from(trips)
    .where(eq(trips.id, tripId))
    .limit(1);
  if (!trip) return { ok: false, message: "That trip no longer exists." };

  await db.insert(tripComments).values({ tripId, authorName, text });

  revalidatePath(`/trips/${trip.slug}`);
  revalidatePath("/trips");
  return { ok: true, message: "Comment added." };
}

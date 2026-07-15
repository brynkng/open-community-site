import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import {
  albumPhotos,
  albums,
  boardPosts,
  boardComments,
  tripComments,
  programs,
  trips,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import {
  hideContentAction,
  unhideContentAction,
  deleteContentAction,
} from "../actions";

export const dynamic = "force-dynamic";

const RECENT_LIMIT = 25;

type ModerationKind = "photo" | "post" | "comment" | "tripComment";

type ModerationRow = {
  kind: ModerationKind;
  id: number;
  createdAt: Date;
  hidden: boolean;
  title: string;
  detail: string;
};

const KIND_LABELS: Record<ModerationKind, string> = {
  photo: "Photo",
  post: "Board post",
  comment: "Board comment",
  tripComment: "Trip talk",
};

async function loadModerationRows(): Promise<ModerationRow[]> {
  const db = getDb();

  const [
    photoRows,
    postRows,
    commentRows,
    tripCommentRows,
    albumRows,
    programRows,
    tripRows,
  ] = await Promise.all([
    db
      .select()
      .from(albumPhotos)
      .orderBy(desc(albumPhotos.createdAt))
      .limit(RECENT_LIMIT),
    db.select().from(boardPosts).orderBy(desc(boardPosts.createdAt)),
    db
      .select()
      .from(boardComments)
      .orderBy(desc(boardComments.createdAt))
      .limit(RECENT_LIMIT),
    db
      .select()
      .from(tripComments)
      .orderBy(desc(tripComments.createdAt))
      .limit(RECENT_LIMIT),
    db.select().from(albums),
    db.select().from(programs),
    db.select().from(trips),
  ]);

  const albumById = new Map(albumRows.map((a) => [a.id, a]));
  const programById = new Map(programRows.map((p) => [p.id, p]));
  const postById = new Map(postRows.map((p) => [p.id, p]));
  const tripById = new Map(tripRows.map((t) => [t.id, t]));

  const rows: ModerationRow[] = [];

  for (const photo of photoRows) {
    const album = albumById.get(photo.albumId);
    const program = album?.programId
      ? programById.get(album.programId)
      : undefined;
    rows.push({
      kind: "photo",
      id: photo.id,
      createdAt: photo.createdAt,
      hidden: photo.hidden,
      title: photo.caption || "(untitled photo)",
      detail: `${program?.name ?? "Unknown program"} · ${album?.name ?? "Unknown album"}`,
    });
  }

  for (const post of postRows.slice(0, RECENT_LIMIT)) {
    const program = post.programId
      ? programById.get(post.programId)
      : undefined;
    rows.push({
      kind: "post",
      id: post.id,
      createdAt: post.createdAt,
      hidden: post.hidden,
      title: post.title,
      detail: `${program?.name ?? "Unknown program"} · by ${post.authorName || "Neighbor"}`,
    });
  }

  for (const comment of commentRows) {
    const post = postById.get(comment.postId);
    const program = post?.programId
      ? programById.get(post.programId)
      : undefined;
    rows.push({
      kind: "comment",
      id: comment.id,
      createdAt: comment.createdAt,
      hidden: comment.hidden,
      title: comment.text.slice(0, 100),
      detail: `Comment on "${post?.title ?? "deleted post"}" (${program?.name ?? "Unknown program"}) · by ${comment.authorName || "Neighbor"}`,
    });
  }

  for (const tc of tripCommentRows) {
    const trip = tripById.get(tc.tripId);
    rows.push({
      kind: "tripComment",
      id: tc.id,
      createdAt: tc.createdAt,
      hidden: tc.hidden,
      title: tc.text.slice(0, 100),
      detail: `Trip talk on "${trip?.title ?? "deleted trip"}" · by ${tc.authorName || "Neighbor"}`,
    });
  }

  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return rows.slice(0, 50);
}

export default async function ModerationPage() {
  await requireAdmin();
  const rows = await loadModerationRows();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Moderation</h1>
          <p className="text-sm text-stone-600">
            Recent community content — photos, board posts, comments, and trip
            talk. Hiding is reversible; deleting is not.
          </p>
        </div>
        <Link href="/admin" className="btn-secondary">
          Back to dashboard
        </Link>
      </div>

      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={`${row.kind}-${row.id}`}
            className={`card flex flex-wrap items-start justify-between gap-3 py-3 ${
              row.hidden ? "opacity-60" : ""
            }`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
                {KIND_LABELS[row.kind]}
                {row.hidden ? " · hidden" : ""}
              </p>
              <p className="font-semibold">{row.title}</p>
              <p className="text-sm text-stone-600">{row.detail}</p>
              <p className="text-xs text-stone-400">
                {row.createdAt.toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {row.hidden ? (
                <form action={unhideContentAction}>
                  <input type="hidden" name="kind" value={row.kind} />
                  <input type="hidden" name="id" value={row.id} />
                  <button className="btn-secondary">Unhide</button>
                </form>
              ) : (
                <form action={hideContentAction}>
                  <input type="hidden" name="kind" value={row.kind} />
                  <input type="hidden" name="id" value={row.id} />
                  <button className="btn-secondary">Hide</button>
                </form>
              )}
              <form action={deleteContentAction}>
                <input type="hidden" name="kind" value={row.kind} />
                <input type="hidden" name="id" value={row.id} />
                <button className="btn-secondary text-red-700">Delete</button>
              </form>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-sm text-stone-500">No community content yet.</p>
        )}
      </div>
    </div>
  );
}

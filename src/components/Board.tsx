"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import type { BoardComment, BoardPost, Program } from "@/db/schema";
import {
  createPostAction,
  addCommentAction,
  voteAction,
  type FormState,
} from "@/app/community/actions";
import { brandForKind } from "@/lib/brands";
import { TurnstileWidget } from "@/components/TurnstileWidget";

export type PostWithComments = {
  post: BoardPost;
  comments: BoardComment[];
};

function formatWhen(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Community board (ports `Board`/`Post` from the design prototype's
 * `shared.jsx`): a post list with up/down vote controls, expandable comments,
 * and inline post/comment composers, all via the U5 community actions +
 * `TurnstileWidget`. Vote arrows reflect the current voter's cookie'd vote
 * (`myVotes`, resolved server-side since the voter-key cookie is httpOnly).
 */
export function Board({
  programId,
  kind,
  posts,
  myVotes,
}: {
  programId: number;
  kind: Program["kind"];
  posts: PostWithComments[];
  myVotes: Record<number, 1 | -1>;
}) {
  const brand = brandForKind(kind);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [token, setToken] = useState("");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createPostAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      setTitle("");
      setBody("");
      setAuthorName("");
      setComposing(false);
    }
  }, [state]);

  return (
    <div data-brand={brand.brandKey}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <h2
          className="ds-section-title"
          style={{ fontFamily: brand.displayFontVar, margin: 0 }}
        >
          The board
        </h2>
        <button
          type="button"
          className="ds-btn"
          style={{ background: `var(--brand-accent, ${brand.accent})` }}
          onClick={() => setComposing((c) => !c)}
        >
          {composing ? "Cancel" : "+ New post"}
        </button>
      </div>

      {composing && (
        <form
          action={formAction}
          className="ds-card"
          style={{ padding: 18, marginBottom: 14, display: "grid", gap: 10 }}
        >
          <input type="hidden" name="programId" value={programId} />
          <input
            className="ds-field"
            placeholder="Title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <textarea
            className="ds-field"
            rows={3}
            placeholder="Say more (optional)"
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              className="ds-field"
              style={{ maxWidth: 200 }}
              placeholder="Name (optional)"
              name="authorName"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
            <TurnstileWidget onVerifyAction={setToken} />
            <input
              type="hidden"
              name="cf-turnstile-response"
              value={token}
              readOnly
            />
            <button
              className="ds-btn"
              style={{ background: `var(--brand-accent, ${brand.accent})` }}
              type="submit"
              disabled={!title.trim() || !token || pending}
            >
              {pending ? "Posting…" : "Post"}
            </button>
          </div>
          {state && !state.ok && (
            <p style={{ margin: 0, fontSize: 13, color: "#b42318" }}>
              {state.message}
            </p>
          )}
        </form>
      )}

      {posts.length === 0 && (
        <p style={{ color: "var(--ds-muted)" }}>
          Nothing posted yet — start the conversation.
        </p>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {posts.map(({ post, comments }) => (
          <Post
            key={post.id}
            post={post}
            comments={comments}
            brand={brand}
            myVote={myVotes[post.id] ?? 0}
          />
        ))}
      </div>
    </div>
  );
}

function Post({
  post,
  comments,
  brand,
  myVote,
}: {
  post: BoardPost;
  comments: BoardComment[];
  brand: ReturnType<typeof brandForKind>;
  myVote: 1 | -1 | 0;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [localVote, setLocalVote] = useState<1 | -1 | 0>(myVote);
  const [localScore, setLocalScore] = useState(post.voteScore);
  const [token, setToken] = useState("");

  const [voteState, voteFormAction] = useActionState<FormState, FormData>(
    voteAction,
    null,
  );
  const [commentState, commentFormAction, commentPending] = useActionState<
    FormState,
    FormData
  >(addCommentAction, null);

  useEffect(() => {
    if (commentState?.ok) setText("");
  }, [commentState]);

  function castVote(clicked: 1 | -1) {
    if (!token) return;
    const next = localVote === clicked ? 0 : clicked;
    setLocalScore((s) => s - localVote + next);
    setLocalVote(next);
    const fd = new FormData();
    fd.set("postId", String(post.id));
    fd.set("dir", String(next));
    fd.set("cf-turnstile-response", token);
    voteFormAction(fd);
  }

  return (
    <article
      className="ds-card"
      style={{ padding: "14px 16px", display: "flex", gap: 14 }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          color: `var(--brand-accent, ${brand.accent})`,
        }}
      >
        <button
          type="button"
          aria-label="upvote"
          aria-pressed={localVote === 1}
          onClick={() => castVote(1)}
          disabled={!token}
          style={{
            border: "none",
            background: "none",
            cursor: token ? "pointer" : "not-allowed",
            fontSize: 16,
            lineHeight: 1,
            color:
              localVote === 1
                ? `var(--brand-accent, ${brand.accent})`
                : "inherit",
            opacity: localVote === 1 ? 1 : 0.55,
          }}
        >
          ▲
        </button>
        <span style={{ fontWeight: 800, fontSize: 14 }}>{localScore}</span>
        <button
          type="button"
          aria-label="downvote"
          aria-pressed={localVote === -1}
          onClick={() => castVote(-1)}
          disabled={!token}
          style={{
            border: "none",
            background: "none",
            cursor: token ? "pointer" : "not-allowed",
            fontSize: 16,
            lineHeight: 1,
            color:
              localVote === -1
                ? `var(--brand-accent, ${brand.accent})`
                : "inherit",
            opacity: localVote === -1 ? 1 : 0.55,
          }}
        >
          ▼
        </button>
        <div style={{ marginTop: 4 }}>
          <TurnstileWidget onVerifyAction={setToken} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{ fontSize: 16.5, cursor: "pointer", margin: 0 }}
          onClick={() => setOpen((o) => !o)}
        >
          {post.title}
        </h3>
        <p
          style={{
            margin: "2px 0 6px",
            fontSize: 13,
            color: "var(--ds-muted)",
          }}
        >
          {post.authorName || "Neighbor"} · {formatWhen(post.createdAt)}
        </p>
        {post.body && (
          <p style={{ margin: "0 0 8px", fontSize: 15 }}>{post.body}</p>
        )}
        {voteState && !voteState.ok && (
          <p style={{ margin: "0 0 6px", fontSize: 12.5, color: "#b42318" }}>
            {voteState.message}
          </p>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            border: "none",
            background: "none",
            color: `var(--brand-accent, ${brand.accent})`,
            fontWeight: 700,
            fontSize: 13.5,
            padding: 0,
            cursor: "pointer",
          }}
        >
          💬 {comments.length} {comments.length === 1 ? "comment" : "comments"}{" "}
          {open ? "▾" : "▸"}
        </button>

        {open && (
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {comments.length === 0 && (
              <p style={{ margin: 0, fontSize: 14, color: "var(--ds-muted)" }}>
                No comments yet.
              </p>
            )}
            {comments.map((c) => (
              <div
                key={c.id}
                style={{
                  background: "rgba(43,33,24,.045)",
                  borderRadius: 10,
                  padding: "8px 12px",
                }}
              >
                <p style={{ margin: 0, fontSize: 14.5 }}>
                  <strong>{c.authorName || "Neighbor"}</strong>{" "}
                  <span style={{ color: "var(--ds-muted)", fontSize: 12.5 }}>
                    {formatWhen(c.createdAt)}
                  </span>
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 14.5 }}>{c.text}</p>
              </div>
            ))}
            <form
              action={commentFormAction}
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <input type="hidden" name="postId" value={post.id} />
              <input
                className="ds-field"
                style={{ flex: "1 1 120px" }}
                placeholder="Reply…"
                name="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <input
                className="ds-field"
                style={{ flex: "0 1 130px" }}
                placeholder="Name"
                name="authorName"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
              <input
                type="hidden"
                name="cf-turnstile-response"
                value={token}
                readOnly
              />
              <button
                className="ds-btn"
                style={{
                  background: `var(--brand-accent, ${brand.accent})`,
                  padding: "10px 16px",
                }}
                type="submit"
                disabled={!text.trim() || !token || commentPending}
              >
                {commentPending ? "Sending…" : "Reply"}
              </button>
            </form>
            {commentState && !commentState.ok && (
              <p style={{ margin: 0, fontSize: 13, color: "#b42318" }}>
                {commentState.message}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

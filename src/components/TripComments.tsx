"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import type { TripComment } from "@/db/schema";
import { addTripCommentAction, type FormState } from "@/app/community/actions";
import { TurnstileWidget } from "@/components/TurnstileWidget";

function formatWhen(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Per-trip "Trip talk" comment thread (ports `TripComments` from the design
 * prototype's `trips.jsx`). Renders inside a brand-scoped ancestor (the trips
 * page/detail sets `data-brand="ft"`), so `var(--brand-*)` tokens resolve
 * without needing brand props here.
 */
export function TripComments({
  tripId,
  comments,
}: {
  tripId: number;
  comments: TripComment[];
}) {
  const [text, setText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [token, setToken] = useState("");
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    addTripCommentAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      setText("");
      setAuthorName("");
    }
  }, [state]);

  return (
    <div>
      <h4
        style={{
          fontFamily: "var(--brand-font, inherit)",
          fontWeight: 700,
          fontSize: 16,
          color: "var(--brand-accent-deep, inherit)",
          marginBottom: 10,
        }}
      >
        Trip talk
      </h4>
      <div style={{ display: "grid", gap: 8 }}>
        {comments.length === 0 && (
          <p style={{ margin: 0, color: "var(--ds-muted)", fontSize: 14.5 }}>
            No comments yet — questions and offers to help go here.
          </p>
        )}
        {comments.map((c) => (
          <div
            key={c.id}
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "8px 12px",
              boxShadow: "0 1px 3px rgba(43,33,24,.07)",
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
          action={formAction}
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 4,
            alignItems: "center",
          }}
        >
          <input type="hidden" name="tripId" value={tripId} />
          <input
            className="ds-field"
            style={{ flex: "2 1 140px" }}
            placeholder="Ask or offer something…"
            name="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            className="ds-field"
            style={{ flex: "1 1 110px", maxWidth: 160 }}
            placeholder="Name"
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
            style={{ background: "var(--brand-accent, inherit)" }}
            type="submit"
            disabled={!text.trim() || !token || pending}
          >
            {pending ? "Sending…" : "Send"}
          </button>
        </form>
        {state && !state.ok && (
          <p style={{ margin: 0, fontSize: 13, color: "#b42318" }}>
            {state.message}
          </p>
        )}
      </div>
    </div>
  );
}

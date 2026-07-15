"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { rsvpAction, type FormState } from "@/app/actions";
import { brandForKind } from "@/lib/brands";
import { TurnstileWidget } from "@/components/TurnstileWidget";

const PARTY_SIZES = [1, 2, 3, 4, 5, 6];

/**
 * RSVP widget for a dinner or ride (ports the design prototype's `RsvpWidget`
 * in `shared.jsx`): a one-tap "quick yes" 👍 that needs no name/email, or a
 * name + party-size form with an OPTIONAL email, plus a live "N in so far"
 * headcount and a recent-names line. Both paths post to the same relaxed
 * `rsvpAction` (U8) and are gated by a single Turnstile challenge (U9) — one
 * `<form>` carries both submit buttons so only one widget has to render, and
 * the clicked button's `name="quick"` value tells `rsvpAction` which shape it
 * is (a native `<button name value>` pair is the only field from the
 * non-clicked button excluded from `FormData`).
 *
 * The initial headcount/recent-names are server-provided (computed from the
 * current `rsvps` rows); a successful submit optimistically layers the new
 * party size / name on top locally so the count feels live without a full
 * page reload. `rsvpAction` doesn't currently revalidate the page, so a
 * refresh is still the source of truth.
 */
export function RsvpWidget({
  kind,
  refId,
  initialHeadcount,
  recentNames,
  prompt,
}: {
  kind: "dinner" | "ride";
  refId: number;
  initialHeadcount: number;
  recentNames: string[];
  /** Card heading, e.g. "Coming this Saturday?" — defaults per brand. */
  prompt?: string;
}) {
  const brand = brandForKind(kind);
  const [state, action, pending] = useActionState<FormState, FormData>(
    rsvpAction,
    null,
  );

  const [token, setToken] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [quickDone, setQuickDone] = useState(false);
  const [popKey, setPopKey] = useState(0);

  const [extraHeadcount, setExtraHeadcount] = useState(0);
  const [extraNames, setExtraNames] = useState<string[]>([]);
  const appliedStateRef = useRef<FormState>(null);
  const pendingPartyRef = useRef(1);
  const pendingNameRef = useRef<string | null>(null);
  const pendingWasQuickRef = useRef(false);

  // Apply the optimistic headcount/name bump exactly once per successful
  // submission (state's identity changes on every action return, even a
  // repeated success, so guard with a ref rather than a value comparison).
  useEffect(() => {
    if (state?.ok && state !== appliedStateRef.current) {
      appliedStateRef.current = state;
      setExtraHeadcount((n) => n + pendingPartyRef.current);
      if (pendingNameRef.current) {
        setExtraNames((names) => [...names, pendingNameRef.current as string]);
      }
      if (pendingWasQuickRef.current) {
        setQuickDone(true);
      } else {
        setName("");
        setEmail("");
        setPartySize(1);
      }
    }
  }, [state]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const submitter = (e.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const isQuick = submitter?.value === "true";
    pendingWasQuickRef.current = isQuick;
    pendingPartyRef.current = isQuick ? 1 : partySize;
    pendingNameRef.current = isQuick ? null : name.trim() || null;
    if (isQuick) setPopKey((k) => k + 1);
  }

  const totalPeople = initialHeadcount + extraHeadcount;
  const allNames = [...recentNames, ...extraNames];
  const canSubmit = !!token && !pending;

  return (
    <div
      className="ds-card"
      data-brand={brand.brandKey}
      style={{
        padding: "20px 22px",
        borderTop: `4px solid var(--brand-accent, ${brand.accent})`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h3
          style={{
            fontFamily: brand.displayFontVar,
            fontSize: 19,
            color: "var(--brand-ink, inherit)",
            margin: 0,
          }}
        >
          {prompt ?? "Coming?"}
        </h3>
        <span
          className="ds-chip"
          style={{
            background: "var(--brand-bg, rgba(43,33,24,.07))",
            color: `var(--brand-accent, ${brand.accent})`,
          }}
        >
          {totalPeople} in so far
        </span>
      </div>

      <form onSubmit={handleSubmit} action={action} style={{ marginTop: 14 }}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="refId" value={refId} />
        <TurnstileWidget onVerifyAction={setToken} className="mb-3" />

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            margin: "0 0 6px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="submit"
            name="quick"
            value="true"
            disabled={!canSubmit || quickDone}
            className="ds-btn ghost"
            style={{
              color: quickDone
                ? "#fff"
                : `var(--brand-accent, ${brand.accent})`,
              background: quickDone
                ? `var(--brand-accent, ${brand.accent})`
                : "transparent",
              minWidth: 120,
            }}
            aria-pressed={quickDone}
          >
            <span
              key={popKey}
              className="ds-pop"
              style={{ display: "inline-block" }}
            >
              👍
            </span>
            {quickDone ? "I'm in!" : "Quick yes"}
          </button>
          <span style={{ color: "var(--ds-muted)", fontSize: 14 }}>
            no name needed — or…
          </span>
        </div>

        <div
          style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}
        >
          <input
            className="ds-field"
            style={{ flex: "2 1 160px" }}
            placeholder="Your name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            className="ds-field"
            style={{ flex: "1 1 110px", maxWidth: 150 }}
            name="partySize"
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
          >
            {PARTY_SIZES.map((n) => (
              <option key={n} value={n}>
                {n === 1 ? "Just me" : `${n} people`}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: 8 }}>
          <input
            className="ds-field"
            type="email"
            placeholder="Email (optional — for a reminder)"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          type="submit"
          name="quick"
          value="false"
          disabled={!canSubmit}
          className="ds-btn"
          style={{
            background: `var(--brand-accent, ${brand.accent})`,
            marginTop: 10,
            width: "100%",
          }}
        >
          {pending ? "Sending…" : "RSVP"}
        </button>

        {!token && (
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 12.5,
              color: "var(--ds-muted)",
            }}
          >
            Verifying you&rsquo;re human… hang tight.
          </p>
        )}
        {state && !state.ok && (
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 14,
              color: "#b42318",
              fontWeight: 600,
            }}
          >
            {state.message}
          </p>
        )}
        {state?.ok && (
          <p
            className="ds-pop"
            style={{
              color: `var(--brand-accent, ${brand.accent})`,
              fontWeight: 700,
              margin: "10px 0 0",
            }}
          >
            {state.message}
          </p>
        )}
      </form>

      {allNames.length > 0 && (
        <p
          style={{ margin: "14px 0 0", fontSize: 14, color: "var(--ds-muted)" }}
        >
          {allNames.slice(-4).join(" · ")}
          {allNames.length > 4 ? ` + ${allNames.length - 4} more` : ""}
        </p>
      )}
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { rsvpAction, type FormState } from "@/app/actions";

export function RsvpForm({ kind, refId }: { kind: "dinner" | "ride"; refId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(rsvpAction, null);

  if (state?.ok) {
    return (
      <div className="rounded-lg bg-green-50 px-4 py-4 text-sm text-green-800">
        {state.message}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="refId" value={refId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" name="name" required autoComplete="name" className="input" placeholder="Your name" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} className="input" placeholder="you@email.com" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="partySize">How many coming?</label>
          <input id="partySize" name="partySize" type="number" inputMode="numeric" min={1} max={20} defaultValue={1} className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="note">Anything to add? (optional)</label>
        <input id="note" name="note" className="input" placeholder="Dietary needs, bringing a friend, etc." />
      </div>
      {state && !state.ok && <p className="text-sm text-red-600">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">
        {pending ? "Sending…" : "Count me in"}
      </button>
    </form>
  );
}

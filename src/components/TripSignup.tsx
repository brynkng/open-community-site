"use client";

import { useActionState } from "react";
import { tripSignupAction, type FormState } from "@/app/trips/actions";
import type { TripPollOption } from "@/db/schema";

export function TripSignup({
  tripId,
  pollOpen,
  options,
}: {
  tripId: number;
  pollOpen: boolean;
  options: TripPollOption[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(tripSignupAction, null);

  if (state?.ok) {
    return <div className="rounded-lg bg-green-50 px-4 py-4 text-sm text-green-800">{state.message}</div>;
  }

  const showPoll = pollOpen && options.length > 0;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="tripId" value={tripId} />
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
      <div className="sm:w-1/2">
        <label className="label" htmlFor="partySize">How many in your group?</label>
        <input id="partySize" name="partySize" type="number" inputMode="numeric" min={1} max={20} defaultValue={1} className="input" />
      </div>

      {showPoll && (
        <fieldset className="rounded-xl border border-stone-200 p-4">
          <legend className="px-1 text-sm font-semibold text-stone-700">Which dates work for you?</legend>
          <p className="mb-2 text-xs text-stone-500">Check every option you could make — we&apos;ll pick the one that works for the most people.</p>
          <div className="space-y-2">
            {options.map((o) => (
              <label key={o.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="options" value={o.id} className="h-4 w-4 rounded border-stone-300 text-brand focus:ring-brand/30" />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div>
        <label className="label" htmlFor="note">Anything to add? (optional)</label>
        <input id="note" name="note" className="input" placeholder="Questions, constraints, who you're bringing…" />
      </div>

      {state && !state.ok && <p className="text-sm text-red-600">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">
        {pending ? "Sending…" : showPoll ? "I'm interested + submit dates" : "I'm interested"}
      </button>
    </form>
  );
}

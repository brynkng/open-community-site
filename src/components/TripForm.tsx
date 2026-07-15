"use client";

import { useActionState } from "react";
import { createTripAction, type AdminState } from "@/app/admin/actions";
import { ProgramSelect } from "./ProgramSelect";
import type { Program } from "@/db/schema";

export function TripForm({ programs }: { programs: Program[] }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(createTripAction, null);
  return (
    <form action={action} className="space-y-4">
      <ProgramSelect programs={programs} />
      <div>
        <label className="label" htmlFor="title">Title</label>
        <input id="title" name="title" required className="input" placeholder="Weekend in the mountains" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="destination">Destination</label>
          <input id="destination" name="destination" className="input" placeholder="Blue Ridge, VA" />
        </div>
        <div>
          <label className="label" htmlFor="estCost">Estimated cost</label>
          <input id="estCost" name="estCost" className="input" placeholder="$150–200 pp" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="tentativeWindow">Tentative window</label>
        <input id="tentativeWindow" name="tentativeWindow" className="input" placeholder="A weekend in late September" />
      </div>
      <div>
        <label className="label" htmlFor="description">Details</label>
        <textarea id="description" name="description" rows={5} className="input" placeholder="What's the plan, what's included, what to expect…" />
      </div>
      <div>
        <label className="label" htmlFor="options">Poll dates (optional, one per line)</label>
        <textarea id="options" name="options" rows={4} className="input" placeholder={"Sat Sep 19\nSat Sep 26\nWeekend of Oct 3"} />
        <p className="mt-1 text-xs text-stone-500">You can add or remove these later too.</p>
      </div>
      <div>
        <label className="label" htmlFor="image">Cover image (needed to post to Instagram)</label>
        <input id="image" name="image" type="file" accept="image/*" className="input" />
      </div>
      {state && !state.ok && <p className="text-sm text-red-600">{state.message}</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Creating…" : "Create trip"}
      </button>
    </form>
  );
}

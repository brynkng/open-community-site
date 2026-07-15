"use client";

import { useActionState } from "react";
import { createProgramAction, type AdminState } from "@/app/admin/actions";

export function ProgramCreateForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(createProgramAction, null);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Program name</label>
          <input id="name" name="name" required className="input" placeholder="Nomadic Bike Philly" />
        </div>
        <div>
          <label className="label" htmlFor="kind">Kind</label>
          <select id="kind" name="kind" required className="input" defaultValue="">
            <option value="" disabled>Choose…</option>
            <option value="ride">Ride group</option>
            <option value="dinner">Dinner</option>
            <option value="trip">Trips</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="tagline">Tagline</label>
        <input id="tagline" name="tagline" className="input" placeholder="Bikes, coffee, and the best of Philly on two wheels." />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="accentColor">Accent color</label>
          <input id="accentColor" name="accentColor" type="color" defaultValue="#1e3a5f" className="h-10 w-full rounded-lg border border-stone-300" />
        </div>
        <div>
          <label className="label" htmlFor="sortOrder">Sort order</label>
          <input id="sortOrder" name="sortOrder" type="number" defaultValue={0} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="logo">Logo</label>
          <input id="logo" name="logo" type="file" accept="image/*" className="input" />
        </div>
      </div>
      {state && (
        <p className={state.ok ? "text-sm text-green-700" : "text-sm text-red-600"}>{state.message}</p>
      )}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Creating…" : "Create program"}
      </button>
    </form>
  );
}

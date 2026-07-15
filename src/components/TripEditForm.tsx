"use client";

import { useActionState } from "react";
import { updateTripAction, type AdminState } from "@/app/admin/actions";
import type { Trip } from "@/db/schema";

export function TripEditForm({ trip }: { trip: Trip }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    updateTripAction,
    null,
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="tripId" value={trip.id} />
      <div>
        <label className="label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          className="input"
          defaultValue={trip.title}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="destination">
            Destination
          </label>
          <input
            id="destination"
            name="destination"
            className="input"
            placeholder="Blue Ridge, VA"
            defaultValue={trip.destination ?? ""}
          />
        </div>
        <div>
          <label className="label" htmlFor="estCost">
            Estimated cost
          </label>
          <input
            id="estCost"
            name="estCost"
            className="input"
            placeholder="$150–200 pp"
            defaultValue={trip.estCost ?? ""}
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="tentativeWindow">
          Tentative window
        </label>
        <input
          id="tentativeWindow"
          name="tentativeWindow"
          className="input"
          placeholder="A weekend in late September"
          defaultValue={trip.tentativeWindow ?? ""}
        />
      </div>
      <div>
        <label className="label" htmlFor="description">
          Details
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          className="input"
          placeholder="What's the plan, what's included, what to expect…"
          defaultValue={trip.description ?? ""}
        />
      </div>
      <div>
        <label className="label" htmlFor="image">
          Cover image{" "}
          {trip.imageKey
            ? "(replace current)"
            : "(needed to post to Instagram)"}
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          className="input"
        />
      </div>
      {state && (
        <p
          className={
            state.ok ? "text-sm text-green-700" : "text-sm text-red-600"
          }
        >
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}

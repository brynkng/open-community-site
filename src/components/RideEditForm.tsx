"use client";

import { useActionState } from "react";
import { updateRideAction, type AdminState } from "@/app/admin/actions";
import { kmToMiles } from "@/lib/utils";
import { MakeRecurringFields } from "./MakeRecurringFields";
import type { Ride } from "@/db/schema";

export function RideEditForm({ ride }: { ride: Ride }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    updateRideAction,
    null,
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={ride.id} />
      <div>
        <label className="label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          className="input"
          defaultValue={ride.title}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            className="input"
            defaultValue={ride.date}
          />
        </div>
        <div>
          <label className="label" htmlFor="startTime">
            Roll-out time
          </label>
          <input
            id="startTime"
            name="startTime"
            placeholder="09:00"
            className="input"
            defaultValue={ride.startTime ?? ""}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="distanceMiles">
            Distance (miles)
          </label>
          <input
            id="distanceMiles"
            name="distanceMiles"
            type="number"
            min={1}
            className="input"
            defaultValue={
              ride.distanceKm != null ? kmToMiles(ride.distanceKm) : ""
            }
          />
        </div>
        <div>
          <label className="label" htmlFor="paceLevel">
            Pace
          </label>
          <select
            id="paceLevel"
            name="paceLevel"
            className="input"
            defaultValue={ride.paceLevel ?? ""}
          >
            <option value="">—</option>
            <option value="social">Social</option>
            <option value="moderate">Moderate</option>
            <option value="spirited">Spirited</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="meetLocation">
          Meeting point
        </label>
        <input
          id="meetLocation"
          name="meetLocation"
          className="input"
          placeholder="Fountain in the square"
          defaultValue={ride.meetLocation ?? ""}
        />
      </div>
      <div>
        <label className="label" htmlFor="routeUrl">
          Route link (Strava/RideWithGPS/Komoot)
        </label>
        <input
          id="routeUrl"
          name="routeUrl"
          type="url"
          className="input"
          placeholder="https://…"
          defaultValue={ride.routeUrl ?? ""}
        />
      </div>
      <div>
        <label className="label" htmlFor="description">
          Ride post / details
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          className="input"
          placeholder="Route notes, what to bring, regroup points…"
          defaultValue={ride.description ?? ""}
        />
      </div>
      <div>
        <label className="label" htmlFor="image">
          Cover image {ride.imageKey ? "(replace current)" : ""}
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          className="input"
        />
      </div>
      {ride.seriesId == null ? (
        <MakeRecurringFields
          defaultWeekday={new Date(ride.date + "T00:00:00Z").getUTCDay()}
        />
      ) : (
        <p className="rounded-lg border border-stone-200 p-3 text-sm text-stone-600">
          Part of a weekly series — pause or delete the series from the
          dashboard.
        </p>
      )}
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
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

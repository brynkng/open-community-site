"use client";

import { useActionState } from "react";
import { createRideAction, type AdminState } from "@/app/admin/actions";
import { ProgramSelect } from "./ProgramSelect";
import { ScheduleFields } from "./ScheduleFields";
import type { Program } from "@/db/schema";

export function RideForm({ programs }: { programs: Program[] }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    createRideAction,
    null,
  );
  return (
    <form action={action} className="space-y-4">
      <ProgramSelect programs={programs} />
      <div>
        <label className="label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          className="input"
          placeholder="Coastal loop + coffee stop"
        />
      </div>
      <ScheduleFields
        defaultWeekday={0}
        timeLabel="Roll-out time"
        timePlaceholder="09:00"
      />
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
            defaultValue=""
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
        />
      </div>
      <div>
        <label className="label" htmlFor="image">
          Cover image
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
        {pending ? "Posting…" : "Post ride"}
      </button>
    </form>
  );
}

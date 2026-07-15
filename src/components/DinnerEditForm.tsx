"use client";

import { useActionState } from "react";
import { updateDinnerAction, type AdminState } from "@/app/admin/actions";
import { MakeRecurringFields } from "./MakeRecurringFields";
import type { Dinner } from "@/db/schema";

export function DinnerEditForm({ dinner }: { dinner: Dinner }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    updateDinnerAction,
    null,
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={dinner.id} />
      <div>
        <label className="label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          name="title"
          className="input"
          defaultValue={dinner.title}
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
            defaultValue={dinner.date}
          />
        </div>
        <div>
          <label className="label" htmlFor="startTime">
            Start time
          </label>
          <input
            id="startTime"
            name="startTime"
            placeholder="18:30"
            className="input"
            defaultValue={dinner.startTime ?? ""}
          />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="location">
          Location
        </label>
        <input
          id="location"
          name="location"
          className="input"
          placeholder="The community hall"
          defaultValue={dinner.location ?? ""}
        />
      </div>
      <div>
        <label className="label" htmlFor="capacity">
          Capacity (optional)
        </label>
        <input
          id="capacity"
          name="capacity"
          type="number"
          min={1}
          className="input"
          placeholder="Leave blank for unlimited"
          defaultValue={dinner.capacity ?? ""}
        />
      </div>
      <div>
        <label className="label" htmlFor="description">
          Details
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="input"
          placeholder="What's on the menu, what to bring…"
          defaultValue={dinner.description ?? ""}
        />
      </div>
      {dinner.seriesId == null ? (
        <MakeRecurringFields
          defaultWeekday={new Date(dinner.date + "T00:00:00Z").getUTCDay()}
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

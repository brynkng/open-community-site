"use client";

import { useActionState } from "react";
import { createDinnerAction, type AdminState } from "@/app/admin/actions";
import { ProgramSelect } from "./ProgramSelect";
import { ScheduleFields } from "./ScheduleFields";
import type { Program } from "@/db/schema";

export function DinnerForm({ programs }: { programs: Program[] }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(
    createDinnerAction,
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
          className="input"
          defaultValue="Saturday Community Dinner"
        />
      </div>
      <ScheduleFields
        defaultWeekday={6}
        timeLabel="Start time"
        timePlaceholder="18:30"
      />
      <div>
        <label className="label" htmlFor="location">
          Location
        </label>
        <input
          id="location"
          name="location"
          className="input"
          placeholder="The community hall"
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
        {pending ? "Saving…" : "Add dinner"}
      </button>
    </form>
  );
}

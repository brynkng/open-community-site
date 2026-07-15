"use client";

import { useState } from "react";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Optional "convert this one-off into a weekly series" control for the edit
 * forms. Off by default (editing a single event never changes recurrence). When
 * on, the update action creates an event_series from the event's details and
 * materializes upcoming dates. Only rendered for events that aren't already part
 * of a series.
 */
export function MakeRecurringFields({
  defaultWeekday,
}: {
  defaultWeekday: number; // 0=Sun … 6=Sat
}) {
  const [on, setOn] = useState(false);
  return (
    <div className="space-y-3 rounded-lg border border-stone-200 p-3">
      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          name="recurring"
          checked={on}
          onChange={(e) => setOn(e.target.checked)}
          className="h-4 w-4"
        />
        Make this a weekly series (auto-adds upcoming dates)
      </label>
      {on && (
        <div>
          <label className="label" htmlFor="weekday">
            Repeats every
          </label>
          <select
            id="weekday"
            name="weekday"
            className="input"
            defaultValue={String(defaultWeekday)}
          >
            {WEEKDAYS.map((day, i) => (
              <option key={i} value={i}>
                {day}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-stone-500">
            A new series is created from these details and future dates are
            generated automatically. This date stays as-is.
          </p>
        </div>
      )}
    </div>
  );
}

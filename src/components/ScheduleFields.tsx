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
 * The date + start-time row for the dinner/ride forms, plus a "Repeats weekly"
 * toggle. When recurring is on, the single-date input is swapped for a weekday
 * picker (`recurring=on` + `weekday`), which the create action turns into an
 * `event_series`. Off = a one-off event on the chosen date.
 */
export function ScheduleFields({
  defaultWeekday,
  timeLabel,
  timePlaceholder,
}: {
  defaultWeekday: number; // 0=Sun … 6=Sat
  timeLabel: string;
  timePlaceholder: string;
}) {
  const [recurring, setRecurring] = useState(false);
  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        {recurring ? (
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
          </div>
        ) : (
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
            />
          </div>
        )}
        <div>
          <label className="label" htmlFor="startTime">
            {timeLabel}
          </label>
          <input
            id="startTime"
            name="startTime"
            placeholder={timePlaceholder}
            className="input"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          name="recurring"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="h-4 w-4"
        />
        Repeats weekly (auto-adds upcoming dates)
      </label>
    </div>
  );
}

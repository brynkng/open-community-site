/** Small helpers shared across the app. */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

/** Random URL-safe token (for unsubscribe links, image keys, etc.). */
export function randomToken(bytes = 16): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Format an ISO date (YYYY-MM-DD) as e.g. "Saturday, July 11". */
export function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Format a 24h "HH:MM" time string as e.g. "6:30 PM". Returns input unchanged if unparseable. */
export function formatTime(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return hhmm;
  const h = Number(m[1]);
  const min = m[2];
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min} ${period}`;
}

const KM_PER_MILE = 1.60934;

/** Convert stored kilometers to whole miles for display. */
export function kmToMiles(km: number): number {
  return Math.round(km / KM_PER_MILE);
}

/** Convert user-entered miles to kilometers for storage. */
export function milesToKm(miles: number): number {
  return Math.round(miles * KM_PER_MILE);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

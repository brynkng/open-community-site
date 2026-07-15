import { redirect } from "next/navigation";
import { env } from "./env";
import { isAuthed } from "./session";

/**
 * Constant-time-ish password comparison. The admin is a single trusted user,
 * so a simple secret compare is sufficient; we still avoid early-exit leaks.
 */
export function checkPassword(input: string): boolean {
  const expected = env().ADMIN_PASSWORD;
  if (!expected || input.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= input.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Guard for admin server components/actions — redirects to login if not authed. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthed())) redirect("/admin/login");
}

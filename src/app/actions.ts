"use server";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { rsvps, subscribers, dinners, rides } from "@/db/schema";
import { sendEmail, baseTemplate } from "@/lib/email";
import { isValidEmail, randomToken, formatDate } from "@/lib/utils";

export type FormState = { ok: boolean; message: string } | null;

/** Public RSVP for a dinner or ride. Upserts on (kind, refId, email). */
export async function rsvpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const kind = String(formData.get("kind") || "") as "dinner" | "ride";
  const refId = Number(formData.get("refId"));
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const partySize = Math.max(1, Math.min(20, Number(formData.get("partySize") || 1)));
  const note = String(formData.get("note") || "").trim() || null;

  if (kind !== "dinner" && kind !== "ride") return { ok: false, message: "Invalid event." };
  if (!refId) return { ok: false, message: "Missing event." };
  if (name.length < 2) return { ok: false, message: "Please enter your name." };
  if (!isValidEmail(email)) return { ok: false, message: "Please enter a valid email." };

  const db = getDb();

  // Look up the event for the confirmation email + capacity check.
  const event =
    kind === "dinner"
      ? (await db.select().from(dinners).where(eq(dinners.id, refId)).limit(1))[0]
      : (await db.select().from(rides).where(eq(rides.id, refId)).limit(1))[0];
  if (!event) return { ok: false, message: "That event no longer exists." };

  const existing = (
    await db
      .select()
      .from(rsvps)
      .where(and(eq(rsvps.kind, kind), eq(rsvps.refId, refId), eq(rsvps.email, email)))
      .limit(1)
  )[0];

  if (existing) {
    await db
      .update(rsvps)
      .set({ name, partySize, note })
      .where(eq(rsvps.id, existing.id));
  } else {
    await db.insert(rsvps).values({ kind, refId, name, email, partySize, note });
  }

  const when = formatDate(event.date);
  try {
    await sendEmail({
      to: email,
      subject: `You're in — ${event.title} (${when})`,
      html: baseTemplate(
        "See you there!",
        `<p>Hi ${name}, thanks for RSVPing to <strong>${event.title}</strong> on <strong>${when}</strong>.</p>
         <p>Party of ${partySize}. If your plans change, just RSVP again to update your headcount.</p>`,
        "You received this because you RSVPed on our community site.",
      ),
    });
  } catch {
    // Non-fatal: RSVP is saved even if the email fails.
  }

  return { ok: true, message: `Thanks ${name} — you're on the list for ${when}.` };
}

/** Newsletter signup. */
export async function subscribeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim() || null;
  if (!isValidEmail(email)) return { ok: false, message: "Please enter a valid email." };

  const db = getDb();
  const existing = (
    await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1)
  )[0];
  if (existing) return { ok: true, message: "You're already subscribed — thanks!" };

  const unsubToken = randomToken(16);
  await db.insert(subscribers).values({ email, name, unsubToken, confirmed: true });

  try {
    await sendEmail({
      to: email,
      subject: "Welcome to the community list",
      html: baseTemplate(
        "You're subscribed 🎉",
        `<p>Thanks for joining! We'll send occasional notes about dinners, rides, and trips.</p>`,
        `Don't want these? <a href="#">Unsubscribe</a> anytime.`,
      ),
    });
  } catch {
    // Non-fatal.
  }

  return { ok: true, message: "You're subscribed — check your inbox!" };
}

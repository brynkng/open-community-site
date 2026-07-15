"use server";

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { trips, tripInterest, tripPollOptions, tripPollVotes } from "@/db/schema";
import { isValidEmail } from "@/lib/utils";

export type FormState = { ok: boolean; message: string } | null;

/**
 * Combined trip signup: records interest (headcount) and, if the poll is open,
 * replaces this voter's availability picks in one submission.
 */
export async function tripSignupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const tripId = Number(formData.get("tripId"));
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const partySize = Math.max(1, Math.min(20, Number(formData.get("partySize") || 1)));
  const note = String(formData.get("note") || "").trim() || null;
  const selected = formData.getAll("options").map((v) => Number(v)).filter(Boolean);

  if (!tripId) return { ok: false, message: "Missing trip." };
  if (name.length < 2) return { ok: false, message: "Please enter your name." };
  if (!isValidEmail(email)) return { ok: false, message: "Please enter a valid email." };

  const db = getDb();
  const [trip] = await db.select().from(trips).where(eq(trips.id, tripId)).limit(1);
  if (!trip) return { ok: false, message: "That trip no longer exists." };

  // Upsert interest on (tripId, email).
  const existing = (
    await db
      .select()
      .from(tripInterest)
      .where(and(eq(tripInterest.tripId, tripId), eq(tripInterest.email, email)))
      .limit(1)
  )[0];
  if (existing) {
    await db
      .update(tripInterest)
      .set({ name, partySize, note })
      .where(eq(tripInterest.id, existing.id));
  } else {
    await db.insert(tripInterest).values({ tripId, name, email, partySize, note });
  }

  // Replace this voter's poll votes (only for options that belong to this trip).
  if (trip.pollOpen && selected.length) {
    const validOptions = await db
      .select()
      .from(tripPollOptions)
      .where(and(eq(tripPollOptions.tripId, tripId), inArray(tripPollOptions.id, selected)));
    const validIds = new Set(validOptions.map((o) => o.id));

    await db
      .delete(tripPollVotes)
      .where(and(eq(tripPollVotes.tripId, tripId), eq(tripPollVotes.voterEmail, email)));

    const toInsert = selected
      .filter((id) => validIds.has(id))
      .map((optionId) => ({ tripId, optionId, voterEmail: email, voterName: name }));
    if (toInsert.length) await db.insert(tripPollVotes).values(toInsert);
  }

  const votedPart = trip.pollOpen && selected.length ? " and your date picks are recorded" : "";
  return { ok: true, message: `Thanks ${name} — you're on the interest list${votedPart}.` };
}

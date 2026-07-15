"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  dinners,
  rides,
  igPosts,
  subscribers,
  programs,
  trips,
  tripInterest,
  tripPollOptions,
  tripPollVotes,
} from "@/db/schema";
import { checkPassword, requireAdmin } from "@/lib/auth";
import { createSession, destroySession } from "@/lib/session";
import { defaultProgramIdForKind } from "@/lib/programs";
import { slugify, randomToken, formatDate } from "@/lib/utils";
import { publishImage } from "@/lib/instagram";
import { env } from "@/lib/env";
import { sendNewsletter, sendEmail, baseTemplate } from "@/lib/email";

export type AdminState = { ok: boolean; message: string } | null;

export async function loginAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const password = String(formData.get("password") || "");
  if (!checkPassword(password)) return { ok: false, message: "Incorrect password." };
  await createSession();
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

/** Create a Saturday dinner instance. */
export async function createDinnerAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const date = String(formData.get("date") || "");
  if (!date) return { ok: false, message: "Pick a date." };
  const programId = Number(formData.get("programId")) || (await defaultProgramIdForKind("dinner"));
  await getDb().insert(dinners).values({
    programId,
    date,
    title: String(formData.get("title") || "Saturday Community Dinner"),
    description: String(formData.get("description") || "") || null,
    location: String(formData.get("location") || "") || null,
    startTime: String(formData.get("startTime") || "") || null,
    capacity: formData.get("capacity") ? Number(formData.get("capacity")) : null,
  });
  revalidatePath("/admin");
  revalidatePath("/dinner");
  return { ok: true, message: "Dinner added." };
}

/** Create a Sunday ride, optionally with a cover image uploaded to R2. */
export async function createRideAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const date = String(formData.get("date") || "");
  if (!title || !date) return { ok: false, message: "Title and date are required." };

  const slug = `${slugify(title)}-${randomToken(3)}`;
  const programId = Number(formData.get("programId")) || (await defaultProgramIdForKind("ride"));

  let imageKey: string | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (file.size > 8 * 1024 * 1024) return { ok: false, message: "Image must be under 8 MB." };
    const ext = file.type.includes("png") ? "png" : "jpg";
    imageKey = `rides/${slug}.${ext}`;
    await env().MEDIA.put(imageKey, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || "image/jpeg" },
    });
  }

  await getDb().insert(rides).values({
    programId,
    slug,
    title,
    date,
    startTime: String(formData.get("startTime") || "") || null,
    meetLocation: String(formData.get("meetLocation") || "") || null,
    distanceKm: formData.get("distanceKm") ? Number(formData.get("distanceKm")) : null,
    paceLevel: (String(formData.get("paceLevel") || "") || null) as never,
    routeUrl: String(formData.get("routeUrl") || "") || null,
    description: String(formData.get("description") || "") || null,
    imageKey,
  });
  revalidatePath("/admin");
  revalidatePath("/rides");
  return { ok: true, message: "Ride posted." };
}

export async function setRideStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as "published" | "draft" | "cancelled";
  await getDb().update(rides).set({ status }).where(eq(rides.id, id));
  revalidatePath("/admin");
  revalidatePath("/rides");
}

/** Publish a ride's cover image + caption to Instagram. */
export async function publishRideToIgAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const db = getDb();
  const [ride] = await db.select().from(rides).where(eq(rides.id, id)).limit(1);
  if (!ride) return;

  if (!ride.imageKey) {
    await db.insert(igPosts).values({
      kind: "ride",
      refId: id,
      caption: ride.title,
      imageKey: "",
      status: "failed",
      error: "Ride has no cover image to post.",
    });
    revalidatePath("/admin");
    return;
  }

  const base = env().R2_PUBLIC_BASE_URL.replace(/\/$/, "");
  const imageUrl = `${base}/${ride.imageKey}`;
  const caption =
    `${ride.title} — ${formatDate(ride.date)}${ride.startTime ? ` @ ${ride.startTime}` : ""}\n` +
    `${ride.meetLocation ? `Meet: ${ride.meetLocation}\n` : ""}` +
    `${ride.description ? `\n${ride.description}\n` : ""}` +
    `\nRSVP on our site. #communityride #sundayride`;

  const [log] = await db
    .insert(igPosts)
    .values({ kind: "ride", refId: id, caption, imageKey: ride.imageKey, status: "pending" })
    .returning();

  try {
    const mediaId = await publishImage(imageUrl, caption);
    await db
      .update(igPosts)
      .set({ status: "published", igMediaId: mediaId, publishedAt: new Date() })
      .where(eq(igPosts.id, log.id));
  } catch (e) {
    await db
      .update(igPosts)
      .set({ status: "failed", error: String(e) })
      .where(eq(igPosts.id, log.id));
  }
  revalidatePath("/admin");
}

/** Send a plain newsletter to all confirmed subscribers. */
export async function sendNewsletterAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!subject || !body) return { ok: false, message: "Subject and body are required." };

  const subs = await getDb().select().from(subscribers).where(eq(subscribers.confirmed, true));
  const emails = subs.map((s) => s.email);
  if (emails.length === 0) return { ok: false, message: "No subscribers yet." };

  const html = baseTemplate(subject, body.replace(/\n/g, "<br/>"), "You're receiving this as a community subscriber.");
  const { sent, failed } = await sendNewsletter(emails, subject, html);
  return { ok: true, message: `Sent to ${sent} subscriber(s)${failed ? `, ${failed} failed` : ""}.` };
}

// ==========================================================================
// Trips (v2): one-off trips with interest gathering + best-time poll
// ==========================================================================

/** Create a trip, optionally with a cover image uploaded to R2. */
export async function createTripAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  if (!title) return { ok: false, message: "Title is required." };

  const slug = `${slugify(title)}-${randomToken(3)}`;
  const programId = Number(formData.get("programId")) || (await defaultProgramIdForKind("trip"));

  let imageKey: string | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (file.size > 8 * 1024 * 1024) return { ok: false, message: "Image must be under 8 MB." };
    const ext = file.type.includes("png") ? "png" : "jpg";
    imageKey = `trips/${slug}.${ext}`;
    await env().MEDIA.put(imageKey, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type || "image/jpeg" },
    });
  }

  const [trip] = await getDb()
    .insert(trips)
    .values({
      programId,
      slug,
      title,
      destination: String(formData.get("destination") || "") || null,
      description: String(formData.get("description") || "") || null,
      tentativeWindow: String(formData.get("tentativeWindow") || "") || null,
      estCost: String(formData.get("estCost") || "") || null,
      imageKey,
    })
    .returning();

  // Optional: seed poll options from a newline-separated textarea.
  const optionsRaw = String(formData.get("options") || "").trim();
  if (optionsRaw) {
    const labels = optionsRaw.split("\n").map((l) => l.trim()).filter(Boolean);
    if (labels.length) {
      await getDb()
        .insert(tripPollOptions)
        .values(labels.map((label, i) => ({ tripId: trip.id, label, sortOrder: i })));
    }
  }

  revalidatePath("/admin");
  revalidatePath("/trips");
  redirect(`/admin/trips/${trip.id}`);
}

/** Add one poll option (candidate date) to a trip. */
export async function addPollOptionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const tripId = Number(formData.get("tripId"));
  const label = String(formData.get("label") || "").trim();
  if (!tripId || !label) return;
  const existing = await getDb().select().from(tripPollOptions).where(eq(tripPollOptions.tripId, tripId));
  await getDb().insert(tripPollOptions).values({ tripId, label, sortOrder: existing.length });
  revalidatePath(`/admin/trips/${tripId}`);
}

/** Remove a poll option and its votes. */
export async function deletePollOptionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const optionId = Number(formData.get("optionId"));
  const tripId = Number(formData.get("tripId"));
  if (!optionId) return;
  const db = getDb();
  await db.delete(tripPollVotes).where(eq(tripPollVotes.optionId, optionId));
  await db.delete(tripPollOptions).where(eq(tripPollOptions.id, optionId));
  revalidatePath(`/admin/trips/${tripId}`);
}

/**
 * Lock in the final date (also closes the poll). Pass empty to reopen.
 * When a NEW date is set, everyone who expressed interest is emailed once —
 * we record the notified date so re-saving the same date won't resend.
 */
export async function setTripFinalDateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const tripId = Number(formData.get("tripId"));
  const finalDate = String(formData.get("finalDate") || "").trim() || null;
  if (!tripId) return;

  const db = getDb();
  const [trip] = await db.select().from(trips).where(eq(trips.id, tripId)).limit(1);
  if (!trip) return;

  await db
    .update(trips)
    .set({ finalDate, pollOpen: finalDate ? false : true })
    .where(eq(trips.id, tripId));

  // Clearing the date: reset notification state so a future lock-in re-notifies.
  if (!finalDate) {
    await db.update(trips).set({ finalDateNotified: null }).where(eq(trips.id, tripId));
    revalidatePath(`/admin/trips/${tripId}`);
    revalidatePath("/trips");
    return;
  }

  // Only notify when the confirmed date is new/changed.
  if (finalDate !== trip.finalDateNotified) {
    const interested = await db.select().from(tripInterest).where(eq(tripInterest.tripId, tripId));
    const when = formatDate(finalDate);
    for (const person of interested) {
      try {
        await sendEmail({
          to: person.email,
          subject: `It's official: ${trip.title} is ${when}`,
          html: baseTemplate(
            `${trip.title} is locked in! 🎉`,
            `<p>Hi ${person.name}, the date is set: <strong>${when}</strong>.</p>
             ${trip.destination ? `<p>Where: ${trip.destination}</p>` : ""}
             ${trip.estCost ? `<p>Estimated cost: ${trip.estCost}</p>` : ""}
             <p>You said you were interested (party of ${person.partySize}) — we'll follow up with details soon. Can't make the date after all? Just reply and let us know.</p>`,
            "You're getting this because you signed up as interested in this trip.",
          ),
        });
      } catch {
        // Non-fatal per recipient.
      }
    }
    await db.update(trips).set({ finalDateNotified: finalDate }).where(eq(trips.id, tripId));
  }

  revalidatePath(`/admin/trips/${tripId}`);
  revalidatePath("/trips");
}

export async function setTripStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const tripId = Number(formData.get("tripId"));
  const status = String(formData.get("status")) as "published" | "draft" | "cancelled";
  await getDb().update(trips).set({ status }).where(eq(trips.id, tripId));
  revalidatePath(`/admin/trips/${tripId}`);
  revalidatePath("/trips");
}

/** Publish a trip's cover image + caption to Instagram. */
export async function publishTripToIgAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const tripId = Number(formData.get("tripId"));
  const db = getDb();
  const [trip] = await db.select().from(trips).where(eq(trips.id, tripId)).limit(1);
  if (!trip) return;

  if (!trip.imageKey) {
    await db.insert(igPosts).values({
      kind: "manual",
      refId: tripId,
      caption: trip.title,
      imageKey: "",
      status: "failed",
      error: "Trip has no cover image to post.",
    });
    revalidatePath(`/admin/trips/${tripId}`);
    return;
  }

  const base = env().R2_PUBLIC_BASE_URL.replace(/\/$/, "");
  const imageUrl = `${base}/${trip.imageKey}`;
  const caption =
    `${trip.title}${trip.destination ? ` — ${trip.destination}` : ""}\n` +
    `${trip.finalDate ? `${formatDate(trip.finalDate)}\n` : trip.tentativeWindow ? `${trip.tentativeWindow}\n` : ""}` +
    `${trip.description ? `\n${trip.description}\n` : ""}` +
    `\nInterested? Details + sign-up on our site. #communitytrip`;

  const [log] = await db
    .insert(igPosts)
    .values({ kind: "manual", refId: tripId, caption, imageKey: trip.imageKey, status: "pending" })
    .returning();

  try {
    const mediaId = await publishImage(imageUrl, caption);
    await db
      .update(igPosts)
      .set({ status: "published", igMediaId: mediaId, publishedAt: new Date() })
      .where(eq(igPosts.id, log.id));
  } catch (e) {
    await db.update(igPosts).set({ status: "failed", error: String(e) }).where(eq(igPosts.id, log.id));
  }
  revalidatePath(`/admin/trips/${tripId}`);
}

// ==========================================================================
// Programs (v3): branded event series
// ==========================================================================

/** Upload a program logo to R2 and return its public URL (or null). */
async function uploadLogo(slug: string, file: FormDataEntryValue | null): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = file.type.includes("png") ? "png" : file.type.includes("svg") ? "svg" : "jpg";
  const key = `brands/${slug}-${randomToken(3)}.${ext}`;
  await env().MEDIA.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || "image/jpeg" },
  });
  return `${env().R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
}

export async function createProgramAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const kind = String(formData.get("kind") || "") as "dinner" | "ride" | "trip";
  if (!name) return { ok: false, message: "Name is required." };
  if (!["dinner", "ride", "trip"].includes(kind)) return { ok: false, message: "Pick a kind." };

  const slug = `${slugify(name)}-${randomToken(2)}`;
  const logoUrl = await uploadLogo(slug, formData.get("logo"));

  await getDb().insert(programs).values({
    slug,
    name,
    kind,
    tagline: String(formData.get("tagline") || "") || null,
    description: String(formData.get("description") || "") || null,
    accentColor: String(formData.get("accentColor") || "#c2410c") || "#c2410c",
    sortOrder: Number(formData.get("sortOrder") || 0),
    logoUrl,
  });
  revalidatePath("/admin/programs");
  revalidatePath("/");
  return { ok: true, message: `Program "${name}" created.` };
}

export async function updateProgramAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;
  const [existing] = await getDb().select().from(programs).where(eq(programs.id, id)).limit(1);
  if (!existing) return;

  const newLogo = await uploadLogo(existing.slug, formData.get("logo"));

  await getDb()
    .update(programs)
    .set({
      name: String(formData.get("name") || existing.name).trim() || existing.name,
      tagline: String(formData.get("tagline") || "") || null,
      accentColor: String(formData.get("accentColor") || existing.accentColor) || existing.accentColor,
      sortOrder: Number(formData.get("sortOrder") || 0),
      active: formData.get("active") === "on",
      ...(newLogo ? { logoUrl: newLogo } : {}),
    })
    .where(eq(programs.id, id));
  revalidatePath("/admin/programs");
  revalidatePath("/");
}

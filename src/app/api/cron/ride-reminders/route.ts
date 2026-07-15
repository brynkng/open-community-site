import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { rsvps, rides, dinners } from "@/db/schema";
import { authorizeCron } from "@/lib/cron";
import { sendEmail, baseTemplate } from "@/lib/email";
import { formatDate, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function tomorrowISO(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Daily: email everyone who RSVPed to an event happening tomorrow.
 * Marks each RSVP so nobody gets reminded twice.
 */
export async function GET(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = getDb();
  const date = tomorrowISO();
  let sent = 0;

  const upcomingRides = await db
    .select()
    .from(rides)
    .where(eq(rides.date, date));
  const upcomingDinners = await db
    .select()
    .from(dinners)
    .where(eq(dinners.date, date));

  const targets: {
    kind: "ride" | "dinner";
    id: number;
    title: string;
    when: string;
    where: string | null;
  }[] = [
    ...upcomingRides
      .filter((r) => r.status === "published")
      .map((r) => ({
        kind: "ride" as const,
        id: r.id,
        title: r.title,
        when: r.startTime ? formatTime(r.startTime) : "",
        where: r.meetLocation,
      })),
    ...upcomingDinners
      .filter((d) => d.status === "published")
      .map((d) => ({
        kind: "dinner" as const,
        id: d.id,
        title: d.title,
        when: d.startTime ? formatTime(d.startTime) : "",
        where: d.location,
      })),
  ];

  for (const t of targets) {
    const pending = await db
      .select()
      .from(rsvps)
      .where(
        and(
          eq(rsvps.kind, t.kind),
          eq(rsvps.refId, t.id),
          isNull(rsvps.reminderSentAt),
        ),
      );
    for (const r of pending) {
      // Anonymous RSVPs (quick-yes, or named without an email) have nothing to remind.
      if (!r.email) continue;
      try {
        await sendEmail({
          to: r.email,
          subject: `Reminder: ${t.title} is tomorrow`,
          html: baseTemplate(
            `See you tomorrow, ${r.name}!`,
            `<p><strong>${t.title}</strong> is tomorrow, ${formatDate(date)}${t.when ? ` at ${t.when}` : ""}.</p>
             ${t.where ? `<p>Where: ${t.where}</p>` : ""}
             <p>You RSVPed for ${r.partySize}. Can't make it? Reply and let us know.</p>`,
            "Reminder from your community group.",
          ),
        });
        await db
          .update(rsvps)
          .set({ reminderSentAt: new Date() })
          .where(eq(rsvps.id, r.id));
        sent++;
      } catch {
        // skip; will retry next run since reminderSentAt stays null
      }
    }
  }

  return NextResponse.json({ ok: true, date, reminders: sent });
}

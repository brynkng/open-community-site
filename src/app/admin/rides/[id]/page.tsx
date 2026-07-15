import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { rides, rsvps } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { RideEditForm } from "@/components/RideEditForm";

export const dynamic = "force-dynamic";

export default async function EditRide({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const rideId = Number(id);
  const db = getDb();

  const [ride] = await db
    .select()
    .from(rides)
    .where(eq(rides.id, rideId))
    .limit(1);
  if (!ride) notFound();

  const attendees = await db
    .select()
    .from(rsvps)
    .where(eq(rsvps.refId, rideId));
  const headcount = attendees
    .filter((r) => r.kind === "ride")
    .reduce((s, r) => s + r.partySize, 0);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/admin" className="text-sm text-brand hover:underline">
        ← Dashboard
      </Link>
      <div className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold">Edit ride</h1>
          <Link
            href={`/rides/${ride.slug}`}
            className="text-sm text-brand hover:underline"
          >
            View public page ↗
          </Link>
        </div>
        <p className="mb-4 text-sm text-stone-600">
          {formatDate(ride.date)} · {headcount} riding · {ride.status}
        </p>
        <RideEditForm ride={ride} />
      </div>
    </div>
  );
}

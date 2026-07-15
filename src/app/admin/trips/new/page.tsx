import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getProgramsByKind } from "@/lib/programs";
import { TripForm } from "@/components/TripForm";

export const dynamic = "force-dynamic";

export default async function NewTrip() {
  await requireAdmin();
  const programs = await getProgramsByKind("trip");
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/admin" className="text-sm text-brand hover:underline">← Back</Link>
      <div className="card">
        <h1 className="text-xl font-bold">New trip</h1>
        <p className="mt-1 text-sm text-stone-600">
          Create the trip, then manage poll dates, interest, and the final date on the next screen.
        </p>
        <div className="mt-4">
          <TripForm programs={programs} />
        </div>
      </div>
    </div>
  );
}

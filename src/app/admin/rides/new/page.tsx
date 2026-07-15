import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getProgramsByKind } from "@/lib/programs";
import { RideForm } from "@/components/RideForm";

export const dynamic = "force-dynamic";

export default async function NewRide() {
  await requireAdmin();
  const programs = await getProgramsByKind("ride");
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/admin" className="text-sm text-brand hover:underline">← Back</Link>
      <div className="card">
        <h1 className="text-xl font-bold">New ride</h1>
        <p className="mt-1 text-sm text-stone-600">
          Add a cover image if you want to be able to post this ride to Instagram.
        </p>
        <div className="mt-4">
          <RideForm programs={programs} />
        </div>
      </div>
    </div>
  );
}

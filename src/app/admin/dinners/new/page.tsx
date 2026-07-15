import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getProgramsByKind } from "@/lib/programs";
import { DinnerForm } from "@/components/DinnerForm";

export const dynamic = "force-dynamic";

export default async function NewDinner() {
  await requireAdmin();
  const programs = await getProgramsByKind("dinner");
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/admin" className="text-sm text-brand hover:underline">← Back</Link>
      <div className="card">
        <h1 className="text-xl font-bold">New dinner</h1>
        <DinnerForm programs={programs} />
      </div>
    </div>
  );
}

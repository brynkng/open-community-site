import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { dinners, rsvps } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { DinnerEditForm } from "@/components/DinnerEditForm";

export const dynamic = "force-dynamic";

export default async function EditDinner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const dinnerId = Number(id);
  const db = getDb();

  const [dinner] = await db
    .select()
    .from(dinners)
    .where(eq(dinners.id, dinnerId))
    .limit(1);
  if (!dinner) notFound();

  const attendees = await db
    .select()
    .from(rsvps)
    .where(eq(rsvps.refId, dinnerId));
  const headcount = attendees
    .filter((r) => r.kind === "dinner")
    .reduce((s, r) => s + r.partySize, 0);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/admin" className="text-sm text-brand hover:underline">
        ← Dashboard
      </Link>
      <div className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold">Edit dinner</h1>
          <span className="text-sm text-stone-600">
            {formatDate(dinner.date)} · {headcount} coming · {dinner.status}
          </span>
        </div>
        <DinnerEditForm dinner={dinner} />
      </div>
    </div>
  );
}

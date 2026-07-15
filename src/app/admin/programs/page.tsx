import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAllPrograms } from "@/lib/programs";
import { ProgramCreateForm } from "@/components/ProgramCreateForm";
import { updateProgramAction } from "../actions";

export const dynamic = "force-dynamic";

const kindLabel: Record<string, string> = { ride: "Ride group", dinner: "Dinner", trip: "Trips" };

export default async function ProgramsAdmin() {
  await requireAdmin();
  const list = await getAllPrograms();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-brand hover:underline">← Dashboard</Link>
        <h1 className="mt-2 text-2xl font-bold">Programs</h1>
        <p className="mt-1 text-sm text-stone-600">
          Branded event series. Each program has its own logo, color and tagline, and shows as a section on the homepage.
        </p>
      </div>

      <section className="card">
        <h2 className="mb-4 text-lg font-bold">New program</h2>
        <ProgramCreateForm />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Existing programs</h2>
        {list.map((p) => (
          <div key={p.id} className="card">
            <div className="mb-3 flex items-center gap-3">
              {p.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logoUrl} alt={p.name} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="inline-block h-12 w-12 rounded-full" style={{ backgroundColor: p.accentColor }} />
              )}
              <div>
                <p className="font-bold">{p.name}</p>
                <p className="text-xs text-stone-500">
                  {kindLabel[p.kind]} · {p.active ? "active" : "hidden"} · /{p.slug}
                </p>
              </div>
            </div>
            <form action={updateProgramAction} className="space-y-3">
              <input type="hidden" name="id" value={p.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Name</label>
                  <input name="name" defaultValue={p.name} className="input" />
                </div>
                <div>
                  <label className="label">Tagline</label>
                  <input name="tagline" defaultValue={p.tagline ?? ""} className="input" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">Accent</label>
                  <input name="accentColor" type="color" defaultValue={p.accentColor} className="h-10 w-full rounded-lg border border-stone-300" />
                </div>
                <div>
                  <label className="label">Sort order</label>
                  <input name="sortOrder" type="number" defaultValue={p.sortOrder} className="input" />
                </div>
                <div>
                  <label className="label">Replace logo</label>
                  <input name="logo" type="file" accept="image/*" className="input" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="active" defaultChecked={p.active} className="h-4 w-4 rounded border-stone-300 text-brand" />
                Show on the site
              </label>
              <button className="btn-secondary">Save changes</button>
            </form>
          </div>
        ))}
      </section>
    </div>
  );
}

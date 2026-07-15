import type { Program } from "@/db/schema";

/** Renders a program picker, or a hidden input when there's only one choice. */
export function ProgramSelect({ programs }: { programs: Program[] }) {
  if (programs.length === 0) return null;
  if (programs.length === 1) {
    return <input type="hidden" name="programId" value={programs[0].id} />;
  }
  return (
    <div>
      <label className="label" htmlFor="programId">Program</label>
      <select id="programId" name="programId" className="input" defaultValue={programs[0].id}>
        {programs.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  );
}

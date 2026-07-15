import type { Program } from "@/db/schema";

/** Branded header shown atop a program-filtered list page. */
export function ProgramHeader({ program }: { program: Program }) {
  return (
    <div
      className="flex items-center gap-4 rounded-3xl border p-6"
      style={{ borderColor: `${program.accentColor}33`, background: `linear-gradient(180deg, ${program.accentColor}14, transparent)` }}
    >
      {program.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={program.logoUrl} alt={program.name} className="h-16 w-16 rounded-full object-cover" style={{ boxShadow: `0 0 0 2px ${program.accentColor}` }} />
      ) : (
        <span className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white" style={{ backgroundColor: program.accentColor }}>
          {program.name.slice(0, 1)}
        </span>
      )}
      <div>
        <h1 className="text-3xl font-extrabold" style={{ color: program.accentColor }}>{program.name}</h1>
        {program.tagline && <p className="mt-1 text-stone-600">{program.tagline}</p>}
      </div>
    </div>
  );
}

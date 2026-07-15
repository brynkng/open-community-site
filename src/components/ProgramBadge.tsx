import Link from "next/link";
import type { Program } from "@/db/schema";

/** Small linked chip showing which program an event belongs to. */
export function ProgramBadge({ program }: { program: Program | null }) {
  if (!program) return null;
  const href =
    program.kind === "dinner"
      ? `/dinner?program=${program.slug}`
      : program.kind === "ride"
        ? `/rides?program=${program.slug}`
        : `/trips?program=${program.slug}`;
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
      style={{ borderColor: `${program.accentColor}55`, color: program.accentColor }}
    >
      {program.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={program.logoUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
      ) : (
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: program.accentColor }} />
      )}
      {program.name}
    </Link>
  );
}

import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { materializeAll } from "@/lib/series";

export const dynamic = "force-dynamic";

/**
 * Daily: keep every active recurring series stocked with its next few weeks of
 * concrete dinner/ride instances. Idempotent — only inserts dates that don't
 * already exist for a series, so it's safe to run on every trigger.
 */
export async function GET(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const created = await materializeAll();
  return NextResponse.json({ ok: true, created });
}

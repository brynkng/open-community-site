import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron";
import { refreshToken } from "@/lib/instagram";

export const dynamic = "force-dynamic";

/** Daily: extend the long-lived Instagram token so it never lapses. */
export async function GET(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    await refreshToken();
    return NextResponse.json({ ok: true, refreshed: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

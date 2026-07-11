import { NextRequest, NextResponse } from "next/server";
import { runBreakingNewsCheck } from "@/lib/digest";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBreakingNewsCheck();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

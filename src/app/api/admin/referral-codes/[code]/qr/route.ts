import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const adminSession = req.cookies.get("admin_session")?.value;
  if (!adminSession || adminSession !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yomitoku-base.com";
  const link = `${appUrl}/register?ref=${code}`;

  const buffer = await QRCode.toBuffer(link, { width: 480, margin: 2 });

  const download = req.nextUrl.searchParams.get("download") === "1";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": download ? `attachment; filename="referral-${code}.png"` : "inline",
      "Cache-Control": "private, max-age=3600",
    },
  });
}

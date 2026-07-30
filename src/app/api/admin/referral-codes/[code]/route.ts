import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// コードの無効化／再有効化（漏洩時などに即時停止するため）
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const adminSession = req.cookies.get("admin_session")?.value;
  if (!adminSession || adminSession !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;
  const { disabled } = await req.json().catch(() => ({ disabled: undefined }));
  if (typeof disabled !== "boolean") {
    return NextResponse.json({ error: "disabledはboolean必須です" }, { status: 400 });
  }

  const existing = await prisma.referralCode.findUnique({ where: { code } });
  if (!existing) {
    return NextResponse.json({ error: "コードが見つかりません" }, { status: 404 });
  }

  const updated = await prisma.referralCode.update({
    where: { code },
    data: { disabledAt: disabled ? new Date() : null },
  });

  return NextResponse.json({ code: updated.code, disabledAt: updated.disabledAt });
}

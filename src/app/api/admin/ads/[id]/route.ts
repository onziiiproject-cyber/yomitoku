import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function requireAdmin(req: NextRequest): boolean {
  const adminSession = req.cookies.get("admin_session")?.value;
  return !!adminSession && adminSession === process.env.ADMIN_SECRET;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { disabled } = await req.json().catch(() => ({ disabled: undefined }));
  if (typeof disabled !== "boolean") {
    return NextResponse.json({ error: "disabledはboolean" }, { status: 400 });
  }

  const ad = await prisma.advertisement.update({
    where: { id },
    data: { disabledAt: disabled ? new Date() : null },
  });
  return NextResponse.json({ disabledAt: ad.disabledAt });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.advertisement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

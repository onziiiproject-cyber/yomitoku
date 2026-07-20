import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";

const generateCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

export async function POST(req: NextRequest) {
  const adminSession = req.cookies.get("admin_session")?.value;
  if (!adminSession || adminSession !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { label, expiresAt, isAmbassador } = await req.json().catch(() => ({ label: undefined, expiresAt: undefined, isAmbassador: false }));
  const trimmedLabel = typeof label === "string" ? label.trim() : "";
  if (!trimmedLabel) {
    return NextResponse.json({ error: "キャンペーン名を入力してください" }, { status: 400 });
  }

  let expiresAtDate: Date | null = null;
  if (typeof expiresAt === "string" && expiresAt) {
    const parsed = new Date(expiresAt);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "有効期限の日付が不正です" }, { status: 400 });
    }
    // 選択した日の終わりまで有効にする
    parsed.setHours(23, 59, 59, 999);
    expiresAtDate = parsed;
  }

  const referralCode = await prisma.referralCode.create({
    data: { code: generateCode(), label: trimmedLabel, expiresAt: expiresAtDate, isAmbassador: isAmbassador === true },
  });

  return NextResponse.json({
    id: referralCode.id,
    code: referralCode.code,
    label: referralCode.label,
    expiresAt: referralCode.expiresAt,
    isAmbassador: referralCode.isAmbassador,
    createdAt: referralCode.createdAt,
  });
}

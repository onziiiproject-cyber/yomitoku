import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { prisma } from "@/lib/prisma";

const generateCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

export async function POST(req: NextRequest) {
  const adminSession = req.cookies.get("admin_session")?.value;
  if (!adminSession || adminSession !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { label, expiresAt, isAmbassador, code } = await req.json().catch(() => ({ label: undefined, expiresAt: undefined, isAmbassador: false, code: undefined }));
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

  // コードは任意で手動指定できる（インフルエンサー名など覚えやすい文字列を使いたいケース向け）。
  // 空欄なら従来通り自動生成する。
  let finalCode: string;
  const trimmedCode = typeof code === "string" ? code.trim().toUpperCase() : "";
  if (trimmedCode) {
    if (!/^[A-Z0-9]{3,20}$/.test(trimmedCode)) {
      return NextResponse.json({ error: "コードは英数字3〜20文字で入力してください" }, { status: 400 });
    }
    const existing = await prisma.referralCode.findUnique({ where: { code: trimmedCode } });
    if (existing) {
      return NextResponse.json({ error: "このコードはすでに使われています" }, { status: 400 });
    }
    finalCode = trimmedCode;
  } else {
    finalCode = generateCode();
  }

  const referralCode = await prisma.referralCode.create({
    data: { code: finalCode, label: trimmedLabel, expiresAt: expiresAtDate, isAmbassador: isAmbassador === true },
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

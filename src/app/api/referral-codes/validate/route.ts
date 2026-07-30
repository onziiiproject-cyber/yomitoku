import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 登録フォームで手入力された紹介コードの有効性をその場で確認するための公開エンドポイント。
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ valid: false });
  }

  const referral = await prisma.referralCode.findUnique({
    where: { code },
    select: { expiresAt: true, isAmbassador: true },
  });
  const valid = !!referral && (!referral.expiresAt || referral.expiresAt > new Date());

  return NextResponse.json({ valid, isAmbassador: valid ? referral!.isAmbassador : false });
}

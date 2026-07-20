import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROFILE_ICONS } from "@/app/base/_components/ProfileAvatar";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.userId) {
    return NextResponse.json({ error: "プロフィールが未設定です" }, { status: 400 });
  }

  const body = await req.json();
  const data: { name?: string; iconKey?: string | null; iconUrl?: string | null } = {};
  let trimmedNickname: string | undefined;

  if (typeof body.nickname === "string") {
    trimmedNickname = body.nickname.trim();
    if (!trimmedNickname || trimmedNickname.length > 20) {
      return NextResponse.json({ error: "ニックネームは1〜20文字で入力してください" }, { status: 400 });
    }
    data.name = trimmedNickname;
  }

  if ("iconKey" in body) {
    const key = body.iconKey;
    if (key !== null && !PROFILE_ICONS.some((i) => i.key === key)) {
      return NextResponse.json({ error: "不正なアイコンです" }, { status: 400 });
    }
    data.iconKey = key;
    data.iconUrl = null; // プリセット選択時はアップロード画像をクリア
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "更新する項目がありません" }, { status: 400 });
  }

  const user = await prisma.user.update({ where: { id: session.userId }, data });

  // LINE連携済みなら表示名をそちらにも反映しておく
  if (trimmedNickname && user.lineRecipientId) {
    await prisma.lineRecipient.update({
      where: { id: user.lineRecipientId },
      data: { nickname: trimmedNickname },
    });
  }

  const token = await createSession({
    ...session,
    nickname: user.name,
    iconKey: user.iconKey ?? undefined,
    iconUrl: user.iconUrl ?? undefined,
  });
  await setSessionCookie(token);

  return NextResponse.json({ nickname: user.name, iconKey: user.iconKey, iconUrl: user.iconUrl });
}

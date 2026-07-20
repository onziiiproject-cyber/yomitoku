import { NextRequest, NextResponse } from "next/server";
import { getSession, createSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.userId) {
    return NextResponse.json({ error: "プロフィールが未設定です" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "画像ファイルを選択してください" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "jpg・png・webp形式の画像を選択してください" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "画像サイズは2MB以内にしてください" }, { status: 400 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const blob = await put(
    `profile-icons/${session.userId}-${Date.now()}.${ext}`,
    file,
    { access: "public", contentType: file.type }
  );

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { iconUrl: blob.url, iconKey: null },
  });

  const token = await createSession({
    ...session,
    iconUrl: user.iconUrl ?? undefined,
    iconKey: undefined,
  });
  await setSessionCookie(token);

  return NextResponse.json({ iconUrl: user.iconUrl });
}

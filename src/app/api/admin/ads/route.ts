import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

const MAX_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  const adminSession = req.cookies.get("admin_session")?.value;
  if (!adminSession || adminSession !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const advertiserName = String(form.get("advertiserName") ?? "").trim();
  const linkUrl = String(form.get("linkUrl") ?? "").trim();
  const placement = String(form.get("placement") ?? "");
  const startAtRaw = String(form.get("startAt") ?? "").trim();
  const endAtRaw = String(form.get("endAt") ?? "").trim();
  const file = form.get("file");

  if (!advertiserName) return NextResponse.json({ error: "広告主名を入力してください" }, { status: 400 });
  if (placement !== "SIDEBAR" && placement !== "FEED") {
    return NextResponse.json({ error: "掲載枠を選択してください" }, { status: 400 });
  }
  try {
    new URL(linkUrl);
  } catch {
    return NextResponse.json({ error: "リンク先URLが不正です" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "画像ファイルを選択してください" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "jpg・png・webp形式の画像を選択してください" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "画像サイズは3MB以内にしてください" }, { status: 400 });
  }

  let startAt: Date | null = null;
  if (startAtRaw) {
    startAt = new Date(startAtRaw);
    if (isNaN(startAt.getTime())) return NextResponse.json({ error: "開始日が不正です" }, { status: 400 });
  }
  let endAt: Date | null = null;
  if (endAtRaw) {
    endAt = new Date(endAtRaw);
    if (isNaN(endAt.getTime())) return NextResponse.json({ error: "終了日が不正です" }, { status: 400 });
    endAt.setHours(23, 59, 59, 999);
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const blob = await put(`ads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`, file, {
    access: "public",
    contentType: file.type,
  });

  const ad = await prisma.advertisement.create({
    data: { advertiserName, imageUrl: blob.url, linkUrl, placement, startAt, endAt },
  });

  return NextResponse.json(ad);
}

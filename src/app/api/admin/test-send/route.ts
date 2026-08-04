import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pushWeeklyDigestCards, type WeeklyCardDoc, type WeeklyAudioBriefingDoc } from "@/lib/line-message";
import { generateWeeklyCardHeroImage } from "@/lib/social-image";
import { put } from "@vercel/blob";
import type { StructuredContent } from "@/lib/anthropic";

export const maxDuration = 120;

// テスト送信は必ず指定したlineUserId 1件だけに送る。
// 過去にunfollowedAt:null && company.status:ACTIVEの全件に送ってしまう実装だった時期があり、
// 「テスト」のつもりで本番の全顧客にメッセージが飛ぶ事故を防ぐため、宛先の指定を必須にしている。
export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const lineUserId = typeof body.lineUserId === "string" ? body.lineUserId.trim() : "";
  if (!lineUserId) {
    return NextResponse.json(
      { error: "lineUserId is required（このエンドポイントは特定1件のみへの送信専用です）" },
      { status: 400 }
    );
  }

  const recipient = await prisma.lineRecipient.findUnique({ where: { lineUserId } });
  if (!recipient) {
    return NextResponse.json({ error: `LineRecipient not found for lineUserId=${lineUserId}` }, { status: 404 });
  }

  // DBから直近ドキュメントを取得（本番の週刊ダイジェスト runWeeklyDigest と全く同じ条件・並び順。
  // 以前はimportance desc（文字列の辞書順ソートで"normal"が"high"より上に来てしまうバグ）＋
  // 直近7日フィルタなしのtake:8だったため、本番では届くはずの記事がテストでは0件に見えることがあった）
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const docs = await prisma.siteDocument.findMany({
    where: { publishedAt: { gte: since }, summary: { not: null } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  const weekAudioBriefings = await prisma.articleAudioBriefing.findMany({
    where: { status: "PUBLISHED", publishedAt: { gte: since } },
    include: { siteDocument: { select: { tags: true } } },
    orderBy: { publishedAt: "desc" },
  });
  const audioBriefingDocs: WeeklyAudioBriefingDoc[] = weekAudioBriefings
    .filter((b) => !!b.heroImageUrl)
    .map((b) => ({
      docId: b.siteDocumentId,
      title: b.title,
      description: b.description,
      heroImageUrl: b.heroImageUrl!,
      tags: (b.siteDocument?.tags as string[] | undefined) ?? [],
    }));

  if (docs.length === 0 && audioBriefingDocs.length === 0) {
    return NextResponse.json({ error: "No documents in DB yet" }, { status: 400 });
  }

  const cardDocs: WeeklyCardDoc[] = await Promise.all(
    docs.map(async (d) => {
      const sc = d.structuredContent as unknown as StructuredContent | null;
      const heroBuffer = await generateWeeklyCardHeroImage({
        source: d.source,
        title: sc?.hookTitle || d.title,
        decisionStatus: d.decisionStatus,
        importanceStars: sc?.importanceStars ?? null,
        urgencyStars: sc?.urgencyStars ?? null,
        shingiVariant: d.shingiVariant,
      });
      const heroBlob = await put(`weekly/test-${d.id}-hero-${Date.now()}.png`, heroBuffer, { access: "public", contentType: "image/png" });
      return {
        id: d.id,
        title: d.title,
        hookTitle: sc?.hookTitle ?? null,
        summary: d.summary ?? "",
        source: d.source,
        tags: (d.tags as string[]) ?? [],
        importanceStars: sc?.importanceStars ?? null,
        urgencyStars: sc?.urgencyStars ?? null,
        isNew: new Date().getTime() - new Date(d.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000,
        decisionStatus: d.decisionStatus,
        heroImageUrl: heroBlob.url,
        shingiVariant: d.shingiVariant,
      };
    })
  );

  try {
    await pushWeeklyDigestCards(lineUserId, "テスト", cardDocs.length + audioBriefingDocs.length, cardDocs, audioBriefingDocs);
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sentTo: lineUserId });
}

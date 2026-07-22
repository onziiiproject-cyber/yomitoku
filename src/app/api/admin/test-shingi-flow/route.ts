import { NextRequest, NextResponse } from "next/server";
import { buildShingiPDFData } from "@/lib/anthropic";
import { generateShingiCoverPDF, generateShingiTopicPDF } from "@/lib/pdf-shingi";
import { pushShingiCover, pushShingiTopics, pushShingiNoMatch } from "@/lib/line-message";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export const maxDuration = 300;

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// POST /api/admin/test-shingi-flow
// body: { url: string, sendLine?: boolean }
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== "Bearer yomitoku-admin-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url, sendLine = false } = await req.json() as { url: string; sendLine?: boolean };
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

  const log: string[] = [];
  const errors: string[] = [];

  try {
    // 1. URLからrawText取得
    log.push(`① URLフェッチ: ${url}`);
    const res = await fetch(url, {
      headers: { "User-Agent": "YomitokuBot/1.0", "Accept-Language": "ja" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const rawText = stripHtml(html).slice(0, 10000);
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? url;
    log.push(`   タイトル: ${title}`);
    log.push(`   rawText: ${rawText.length}文字取得`);

    // 2. Claude Sonnetで構造化
    log.push("② Claude Sonnetで構造化データ抽出...");
    const pdfData = await buildShingiPDFData(title, rawText, url);
    log.push(`   第${pdfData.meta.session_no}回 / テーマ数: ${pdfData.themes.length}`);
    log.push(`   テーマ: ${pdfData.themes.map(t => t.name).join(" / ")}`);

    // 3. 表紙PDF生成 → Blob
    log.push("③ 表紙PDF生成...");
    const coverBuffer = await generateShingiCoverPDF(pdfData);
    const coverBlob = await put(
      `shingi/session-${pdfData.meta.session_no}/cover.pdf`,
      coverBuffer,
      { access: "public", contentType: "application/pdf", addRandomSuffix: false, allowOverwrite: true }
    );
    log.push(`   表紙PDF → ${coverBlob.url}`);

    // 4. トピックPDF生成 → Blob
    log.push("④ トピックPDF生成...");
    const topicPdfUrls: Record<number, string> = {};
    for (const theme of pdfData.themes) {
      try {
        const buf = await generateShingiTopicPDF(pdfData, theme.no);
        const blob = await put(
          `shingi/session-${pdfData.meta.session_no}/topic-${theme.no}.pdf`,
          buf,
          { access: "public", contentType: "application/pdf", addRandomSuffix: false, allowOverwrite: true }
        );
        topicPdfUrls[theme.no] = blob.url;
        log.push(`   テーマ${theme.no}「${theme.name}」→ ${blob.url}`);
      } catch (e) {
        errors.push(`テーマ${theme.no} PDF失敗: ${e}`);
      }
    }

    // 5. LINE送信（sendLine=trueの時のみ）
    let lineSent = 0;
    if (sendLine) {
      log.push("⑤ LINE送信...");
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yomitoku-base.com";
      const recipients = await prisma.lineRecipient.findMany({
        where: { unfollowedAt: null, company: { status: "ACTIVE" } },
        include: { user: { include: { tags: { include: { tag: true } } } } },
      });
      log.push(`   対象: ${recipients.length}人`);

      for (const recipient of recipients) {
        try {
          await pushShingiCover(
            recipient.lineUserId,
            pdfData.meta.session_no,
            pdfData.meta.council_name.replace("社会保障審議会 ", ""),
            pdfData.meta.date,
            pdfData.meta.feature_label,
            pdfData.themes.map(t => t.name),
            coverBlob.url
          );

          const userTags = recipient.user?.tags.map(ut => ut.tag.key) ?? [];
          if (userTags.length > 0) {
            const matchingThemes = pdfData.theme_details.filter(d =>
              d.related_roles.some(r => userTags.includes(r))
            );
            if (matchingThemes.length > 0) {
              const available = matchingThemes.filter(t => topicPdfUrls[t.no]);
              if (available.length > 0) {
                await pushShingiTopics(
                  recipient.lineUserId,
                  pdfData.meta.session_no,
                  available.map(t => ({ no: t.no, name: t.name })),
                  topicPdfUrls
                );
              }
            } else {
              await pushShingiNoMatch(recipient.lineUserId, pdfData.meta.session_no, baseUrl);
            }
          }
          lineSent++;
        } catch (e) {
          errors.push(`LINE送信失敗 ${recipient.lineUserId}: ${e}`);
        }
      }
      log.push(`   送信完了: ${lineSent}人`);
    } else {
      log.push("⑤ LINE送信スキップ（sendLine=falseのため）");
    }

    return NextResponse.json({
      ok: true,
      sessionNo: pdfData.meta.session_no,
      themes: pdfData.themes.map(t => ({ no: t.no, name: t.name, color: t.color })),
      coverPdfUrl: coverBlob.url,
      topicPdfUrls,
      lineSent,
      log,
      errors,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e), log, errors }, { status: 500 });
  }
}

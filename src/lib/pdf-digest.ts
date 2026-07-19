import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export interface PDFDigestDoc {
  id: string;
  title: string;
  summary: string;
  url: string;
  importance: string;
  tags: string[];
  publishedAt: Date | null;
  source: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatJpDate(date: Date | null): string {
  if (!date) return "—";
  const reiwa = date.getFullYear() - 2018;
  return `令和${reiwa}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function assetBase64(relativePath: string, mime = "image/png"): string {
  const buf = fs.readFileSync(path.join(process.cwd(), relativePath));
  return `data:${mime};base64,${buf.toString("base64")}`;
}

// ─── design tokens ───────────────────────────────────────────────────────────

const T = {
  primary:      "#178C7E",
  tintBg:       "#e8f4f2",
  tintLight:    "#e6f2f0",
  badgeHighBg:  "#fde7e7",
  badgeHighTx:  "#d64545",
  badgeNoteBg:  "#fdf0dc",
  badgeNoteTx:  "#c9822a",
  itemBorder:   "#e3e8e7",
  footerNoteBg: "#f4f7f6",
  textPrimary:  "#1a1a1a",
  textSub:      "#3a3a3a",
  textBody:     "#4a4a4a",
  textMuted:    "#666666",
  white:        "#ffffff",
  pageBg:       "#fbfbfa",
} as const;

// ─── badge ───────────────────────────────────────────────────────────────────

function badge(importance: string) {
  if (importance === "high")
    return { label: "重要", bg: T.badgeHighBg, color: T.badgeHighTx };
  return { label: "通知", bg: T.tintBg, color: T.primary };
}

// ─── category label ──────────────────────────────────────────────────────────

function categoryLabel(tags: string[]): string {
  if (tags.some(t => ["安全対策", "BCP", "感染対策"].includes(t))) return "安全・事故防止";
  if (tags.some(t => ["制度改正", "Q&A"].includes(t))) return "制度改正";
  if (tags.some(t => ["補助金・助成金", "公募"].includes(t))) return "補助金・助成金";
  if (tags.some(t => ["加算・減算", "報酬改定"].includes(t))) return "加算・報酬";
  if (tags.some(t => ["人材採用", "処遇改善"].includes(t))) return "人材・処遇";
  if (tags.some(t => ["ICT・DX", "生産性向上"].includes(t))) return "ICT・DX";
  if (tags.some(t => ["セミナー", "ガイドライン", "事例紹介"].includes(t))) return "ガイドライン";
  if (tags.some(t => ["人員基準", "運営指導"].includes(t))) return "運営基準";
  if (tags.length > 0) return tags[0];
  return "通知";
}

// ─── category icon ───────────────────────────────────────────────────────────

function categoryIconSVG(tags: string[]): string {
  const c = T.primary;
  const base = `fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

  if (tags.some(t => ["安全対策", "BCP", "感染対策"].includes(t)))
    return `<svg width="44" height="44" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" fill="${c}"/>
      <line x1="12" y1="8" x2="12" y2="13" stroke="white" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="16" r="1.3" fill="white"/>
    </svg>`;

  if (tags.some(t => ["制度改正", "Q&A"].includes(t)))
    return `<svg width="44" height="44" viewBox="0 0 24 24" ${base}>
      <line x1="12" y1="3" x2="12" y2="19"/>
      <line x1="5" y1="6" x2="19" y2="6"/>
      <path d="M5 6l-3 6a3 3 0 0 0 6 0L5 6z"/>
      <path d="M19 6l-3 6a3 3 0 0 0 6 0L19 6z"/>
      <line x1="8" y1="19" x2="16" y2="19"/>
    </svg>`;

  if (tags.some(t => ["補助金・助成金", "公募"].includes(t)))
    return `<svg width="44" height="44" viewBox="0 0 24 24" ${base}>
      <circle cx="12" cy="12" r="9"/>
      <line x1="12" y1="7" x2="12" y2="17"/>
      <path d="M15 9.5c0-1.4-1.3-2.5-3-2.5s-3 1.1-3 2.5 1.3 2.5 3 2.5 3 1.1 3 2.5-1.3 2.5-3 2.5-3-1.1-3-2.5"/>
    </svg>`;

  if (tags.some(t => ["加算・減算", "報酬改定"].includes(t)))
    return `<svg width="44" height="44" viewBox="0 0 24 24" ${base}>
      <rect x="4" y="3" width="16" height="18" rx="2"/>
      <path d="M8 16v-4M12 16V9M16 16v-6" stroke-linecap="round"/>
    </svg>`;

  if (tags.some(t => ["人材採用", "処遇改善"].includes(t)))
    return `<svg width="44" height="44" viewBox="0 0 24 24" ${base}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`;

  if (tags.some(t => ["ICT・DX", "生産性向上"].includes(t)))
    return `<svg width="44" height="44" viewBox="0 0 24 24" ${base}>
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>`;

  if (tags.some(t => ["セミナー", "ガイドライン", "事例紹介"].includes(t)))
    return `<svg width="44" height="44" viewBox="0 0 24 24" ${base}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>`;

  // default: clipboard + bar chart (survey/data)
  return `<svg width="44" height="44" viewBox="0 0 24 24" ${base}>
    <rect x="4" y="3" width="16" height="18" rx="2"/>
    <path d="M8 16v-3M12 16V9M16 16v-5" stroke-linecap="round"/>
  </svg>`;
}

// ─── card HTML ───────────────────────────────────────────────────────────────

function cardHTML(doc: PDFDigestDoc, index: number): string {
  const b = badge(doc.importance);
  const cat = categoryLabel(doc.tags);
  const icon = categoryIconSVG(doc.tags);
  const date = formatJpDate(doc.publishedAt);

  return `
<div class="card">
  <div class="card-left">
    <div class="card-icon-box">${icon}</div>
    <span class="card-tag">${cat}</span>
  </div>
  <div class="card-right">
    <div>
      <div class="card-title-row">
        <div class="card-title">${doc.title}</div>
        <span class="badge" style="background:${b.bg};color:${b.color}">${b.label}</span>
      </div>
      <div class="card-summary">${doc.summary ?? ""}</div>
    </div>
    <div class="card-foot">
      <div class="card-meta">
        <span class="card-meta-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${T.primary}" stroke-width="2" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          No.${index + 1}
        </span>
        <span class="card-meta-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${T.primary}" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="3"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="2" x2="7" y2="6"/><line x1="17" y1="2" x2="17" y2="6"/></svg>
          ${date}
        </span>
      </div>
      <a class="card-link" href="${doc.url}">資料PDFを見る →</a>
    </div>
  </div>
</div>`;
}

// ─── HTML build ───────────────────────────────────────────────────────────────

async function buildHTML(
  dateRange: { from: string; to: string },
  docs: PDFDigestDoc[],
  aiComment: string
): Promise<string> {
  const logo = assetBase64("public/icons/icon-gori-editor.jpg");
  const illustration = assetBase64("public/design/clipboard-illustration.png");
  const highCount = docs.filter(d => d.importance === "high").length;

  const chunks: Array<{ docs: PDFDigestDoc[]; offset: number }> = [];
  for (let i = 0; i < docs.length; i += 3) {
    chunks.push({ docs: docs.slice(i, i + 3), offset: i });
  }

  const allTags = [...new Set(docs.flatMap(d => d.tags))].slice(0, 12);

  // ─ Cover (exactly per design_handoff_yomitoku_digest, 1600×900) ─
  const coverPage = `
<div class="page">
  <div style="width:1600px;height:900px;background:${T.pageBg};display:flex;align-items:center;justify-content:center;font-family:var(--font);">
    <div style="position:relative;width:1520px;height:820px;background:${T.white};border-radius:32px;box-shadow:0 20px 60px rgba(20,40,38,0.08);overflow:hidden;padding:56px 64px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:space-between;">

      <div style="display:flex;flex-direction:column;gap:28px;max-width:900px;z-index:2;">

        <!-- logo -->
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <img src="${logo}" style="height:38px;width:38px;border-radius:50%;object-fit:cover;" alt="">
            <span style="font-size:22px;font-weight:800;color:${T.textPrimary};">ヨミトク編集部</span>
          </div>
          <div style="font-size:15px;font-weight:600;color:${T.textSub};letter-spacing:0.15em;">介護保険最新情報</div>
        </div>

        <!-- title -->
        <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px;">
          <div style="font-size:64px;font-weight:800;color:${T.textPrimary};line-height:1.25;letter-spacing:0.01em;">介護保険最新情報</div>
          <div style="font-size:64px;font-weight:800;color:${T.primary};line-height:1.25;letter-spacing:0.01em;">週刊ヨミトク</div>
        </div>

        <!-- date pill -->
        <div style="display:inline-flex;align-items:center;gap:12px;border:2px solid ${T.primary};border-radius:999px;padding:14px 28px;width:fit-content;margin-top:8px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="16" rx="3" stroke="${T.primary}" stroke-width="2"/>
            <line x1="3" y1="10" x2="21" y2="10" stroke="${T.primary}" stroke-width="2"/>
            <line x1="7" y1="2" x2="7" y2="6" stroke="${T.primary}" stroke-width="2"/>
            <line x1="17" y1="2" x2="17" y2="6" stroke="${T.primary}" stroke-width="2"/>
          </svg>
          <div style="font-size:24px;font-weight:700;color:${T.primary};">対象期間：${dateRange.from}〜${dateRange.to}</div>
        </div>

        <!-- count banner -->
        <div style="display:flex;align-items:center;gap:20px;background:${T.tintBg};border-radius:20px;padding:24px 32px;margin-top:8px;">
          <div style="width:56px;height:56px;border-radius:50%;background:${T.primary};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="3" width="16" height="18" rx="2" stroke="white" stroke-width="2"/>
              <line x1="8" y1="8" x2="16" y2="8" stroke="white" stroke-width="2"/>
              <line x1="8" y1="12" x2="16" y2="12" stroke="white" stroke-width="2"/>
              <line x1="8" y1="16" x2="13" y2="16" stroke="white" stroke-width="2"/>
            </svg>
          </div>
          <div style="font-size:26px;font-weight:700;color:${T.textPrimary};">今回は<span style="color:${T.primary};font-size:30px;font-weight:800;">${docs.length}件</span>の通知をまとめました${highCount > 0 ? `（うち重要 <span style="color:${T.badgeHighTx};font-weight:800;">${highCount}件</span>）` : ""}</div>
        </div>
      </div>

      <!-- footer disclaimer -->
      <div style="display:flex;align-items:flex-start;gap:10px;max-width:900px;z-index:2;">
        <div style="width:22px;height:22px;border-radius:50%;border:2px solid ${T.primary};color:${T.primary};font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">i</div>
        <div style="font-size:15px;color:${T.textMuted};line-height:1.7;">
          ※ 厚生労働省「介護保険最新情報」ページをもとにした自動要約です。<br>正式な内容は原文でご確認ください。
        </div>
      </div>

      <!-- illustration -->
      <img src="${illustration}" alt="" style="position:absolute;right:-20px;top:50%;transform:translateY(-50%);width:560px;height:560px;object-fit:contain;z-index:1;"/>
    </div>
  </div>
</div>`;

  // ─ Content pages (adapted from design_handoff_yomitoku_digest_t, 1600×900) ─
  const contentPages = chunks.map((chunk, ci) => `
<div class="page">
  <div style="width:1600px;height:900px;background:${T.pageBg};display:flex;align-items:center;justify-content:center;font-family:var(--font);">
    <div style="width:1524px;height:842px;background:${T.white};border-radius:26px;box-shadow:0 20px 60px rgba(20,40,38,0.08);overflow:hidden;padding:38px 46px;box-sizing:border-box;display:flex;flex-direction:column;gap:22px;">

      <!-- header -->
      <div style="display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:18px;">
          <div style="width:60px;height:60px;border-radius:50%;background:${T.primary};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M3 10v4h3l5 4V6L6 10H3z" fill="white"/>
              <path d="M15 9c1.2 1 1.2 5 0 6" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
              <path d="M17.5 6.5c2.2 2 2.2 9 0 11" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>
            </svg>
          </div>
          <div style="font-size:36px;font-weight:800;color:${T.textPrimary};">今週の通知一覧（${ci + 1}/${chunks.length}）</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="${logo}" style="height:32px;width:32px;border-radius:50%;object-fit:cover;" alt="">
          <div style="display:flex;flex-direction:column;gap:2px;">
            <div style="font-size:14px;font-weight:800;color:${T.textPrimary};">ヨミトク編集部</div>
            <div style="font-size:12px;font-weight:600;color:${T.textSub};letter-spacing:0.1em;">介護保険最新情報</div>
          </div>
        </div>
      </div>

      <!-- cards -->
      <div style="display:flex;flex-direction:column;gap:16px;flex:1;min-height:0;">
        ${chunk.docs.map((d, di) => {
          const b = badge(d.importance);
          const cat = categoryLabel(d.tags);
          const icon = categoryIconSVG(d.tags);
          const date = formatJpDate(d.publishedAt);
          return `
        <div style="display:flex;gap:28px;align-items:stretch;border:1.5px solid ${T.itemBorder};border-radius:20px;padding:24px 30px;flex:1;min-height:0;overflow:hidden;">
          <div style="display:flex;flex-direction:column;align-items:center;gap:12px;width:140px;flex-shrink:0;justify-content:center;">
            <div style="width:90px;height:90px;border-radius:18px;background:${T.tintBg};display:flex;align-items:center;justify-content:center;">${icon}</div>
            <div style="background:${T.tintBg};color:${T.primary};font-size:14px;font-weight:700;border-radius:999px;padding:7px 16px;text-align:center;white-space:nowrap;">${cat}</div>
          </div>
          <div style="display:flex;flex-direction:column;justify-content:space-between;flex:1;min-width:0;">
            <div>
              <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:10px;">
                <div style="font-size:24px;font-weight:800;color:${T.textPrimary};line-height:1.4;flex:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${d.title}</div>
                <div style="background:${b.bg};color:${b.color};font-size:15px;font-weight:700;border-radius:8px;padding:4px 14px;flex-shrink:0;white-space:nowrap;margin-top:3px;">${b.label}</div>
              </div>
              <div style="font-size:17px;color:${T.textBody};line-height:1.7;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${d.summary ?? ""}</div>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;">
              <div style="display:flex;align-items:center;gap:26px;">
                <div style="display:flex;align-items:center;gap:8px;color:${T.primary};font-size:16px;font-weight:600;">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${T.primary}" stroke-width="2" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  No.${chunk.offset + di + 1}
                </div>
                <div style="display:flex;align-items:center;gap:8px;color:${T.primary};font-size:16px;font-weight:600;">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${T.primary}" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="3"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="2" x2="7" y2="6"/><line x1="17" y1="2" x2="17" y2="6"/></svg>
                  ${date}
                </div>
              </div>
              <a style="color:${T.primary};font-size:17px;font-weight:700;text-decoration:underline;" href="${d.url}">資料PDFを見る →</a>
            </div>
          </div>
        </div>`;
        }).join("")}
      </div>

      <!-- footer note -->
      <div style="display:flex;align-items:center;gap:12px;background:${T.footerNoteBg};border-radius:14px;padding:14px 22px;flex-shrink:0;">
        <div style="width:22px;height:22px;border-radius:50%;border:2px solid ${T.primary};color:${T.primary};font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">i</div>
        <div style="font-size:14px;color:${T.textMuted};">※ 厚生労働省「介護保険最新情報」ページをもとにした自動要約です。正式な内容は原文でご確認ください。</div>
      </div>

    </div>
  </div>
</div>`).join("");

  // ─ AI comment page ─
  const aiPage = `
<div class="page">
  <div style="width:1600px;height:900px;background:linear-gradient(135deg,${T.primary} 0%,#0A6B5F 100%);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;font-family:var(--font);">
    <div style="position:absolute;top:-120px;right:-120px;width:480px;height:480px;border-radius:50%;background:rgba(255,255,255,0.05);"></div>
    <div style="position:absolute;bottom:-90px;left:-90px;width:360px;height:360px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>
    <div style="position:absolute;top:36px;right:52px;font-size:20px;font-weight:800;color:white;opacity:0.6;">ヨミトク編集部</div>
    <div style="max-width:860px;text-align:center;position:relative;z-index:1;padding:0 64px;">
      <div style="display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:100px;padding:10px 28px;margin-bottom:32px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        <span style="font-size:16px;font-weight:600;color:rgba(255,255,255,0.92);letter-spacing:0.08em;">今週のAIコメント</span>
      </div>
      <div style="font-size:22px;font-weight:500;color:white;line-height:1.9;margin-bottom:36px;">${aiComment}</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
        ${allTags.map(t => `<span style="font-size:14px;font-weight:500;color:rgba(255,255,255,0.8);background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.22);padding:6px 18px;border-radius:100px;">${t}</span>`).join("")}
      </div>
    </div>
    <div style="position:absolute;bottom:20px;left:0;right:0;text-align:center;font-size:12px;color:rgba(255,255,255,0.35);">
      ※ AIによる自動生成です。正式な内容は各通知の原文でご確認ください。
    </div>
  </div>
</div>`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root { --font: "Noto Sans JP","Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic",sans-serif; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { size: 1600px 900px; margin: 0; }
  .page { width: 1600px; height: 900px; overflow: hidden; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  a { color: inherit; text-decoration: inherit; }
</style>
</head>
<body>
${coverPage}
${contentPages}
${aiPage}
</body>
</html>`;
}

// ─── main export ─────────────────────────────────────────────────────────────

export async function generateDigestPDF(
  docs: PDFDigestDoc[],
  _weekLabel: string,
  dateRange: { from: string; to: string },
  aiComment: string
): Promise<Buffer> {
  const html = await buildHTML(dateRange, docs, aiComment);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "load", timeout: 30000 });
    // Google Fontsのダウンロード + レンダリング完了を待つ
    await page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready);
    await new Promise(r => setTimeout(r, 1500));

    const pdf = await page.pdf({
      width: "1600px",
      height: "900px",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

// PNG出力（LINE送信用）
export async function generateDigestPNG(
  docs: PDFDigestDoc[],
  _weekLabel: string,
  dateRange: { from: string; to: string },
  aiComment: string
): Promise<Buffer[]> {
  const html = await buildHTML(dateRange, docs, aiComment);
  const chunks: number[] = [];
  for (let i = 0; i < docs.length; i += 3) chunks.push(i);
  const totalPages = chunks.length + 2; // cover + content pages + AI page

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "load", timeout: 30000 });
    await page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready);
    await new Promise(r => setTimeout(r, 1500));

    const pages: Buffer[] = [];
    for (let i = 0; i < totalPages; i++) {
      await page.evaluate((idx) => {
        const els = document.querySelectorAll(".page");
        els.forEach((el, j) => {
          (el as HTMLElement).style.display = j === idx ? "block" : "none";
        });
      }, i);
      const screenshot = await page.screenshot({ type: "png" });
      pages.push(Buffer.from(screenshot));
    }
    return pages;
  } finally {
    await browser.close();
  }
}

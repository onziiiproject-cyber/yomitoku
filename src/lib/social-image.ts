import sharp from "sharp";
import { readFileSync } from "fs";
import path from "path";

const GORI_ICON_PATH = path.join(process.cwd(), "public/mascot/gori-base-face.png");
const COVER_BG_PATH: Record<string, string> = {
  mhlw_latest: path.join(process.cwd(), "public/covers/mhlw-bg.jpg"),
  shingi: path.join(process.cwd(), "public/covers/shingi-bg.jpg"),
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// 日本語混じりの文字数ベースの簡易折り返し（幅計測なし）
function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const ch of text) {
    current += ch;
    if (current.length >= maxCharsPerLine) {
      lines.push(current);
      current = "";
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines && [...text].length > lines.join("").length) {
    lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1) + "…";
  }
  return lines;
}

const SRC_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  mhlw_latest: { label: "介護保険最新情報", color: "#0D686E", bg: "#E8F5F1" },
  shingi: { label: "分科会かんたん解説", color: "#B45309", bg: "#FEF3C7" },
};

const DECISION_STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  discussion: { label: "議論中", bg: "#FEF3C7", color: "#B45309" },
  decided: { label: "決定事項", bg: "#E8F5F1", color: "#0D686E" },
};

function badgeRowSvg(badges: { label: string; bg: string; color: string }[], x0: number, y0: number): string {
  let x = x0;
  const parts: string[] = [];
  for (const b of badges) {
    const w = b.label.length * 26 + 48;
    parts.push(`
      <rect x="${x}" y="${y0}" width="${w}" height="52" rx="10" fill="${b.bg}" />
      <text x="${x + w / 2}" y="${y0 + 34}" font-family="${FONT}" font-size="24" font-weight="800" fill="${b.color}" text-anchor="middle">${escapeXml(b.label)}</text>
    `);
    x += w + 14;
  }
  return parts.join("");
}

const FONT = "Hiragino Kaku Gothic ProN, Hiragino Sans, Noto Sans JP, sans-serif";
const W = 1080;
const H = 1080;

async function footerSvg(color: string): Promise<{ svg: string; goriIcon: Buffer }> {
  const goriIcon = await sharp(readFileSync(GORI_ICON_PATH)).resize(110, 110).png().toBuffer();
  const svg = `
    <rect x="0" y="${H - 90}" width="${W}" height="90" fill="${color}" />
    <text x="${W / 2 - 40}" y="${H - 38}" font-family="${FONT}" font-size="28" font-weight="700" fill="#ffffff" text-anchor="middle">続きはヨミトク編集室で読む</text>
  `;
  return { svg, goriIcon };
}

// ── ① 表紙カード ──────────────────────────────────────────────────────────
export async function generateCoverCardImage(params: {
  title: string;
  subtitle: string;
  source: string;
  tags: string[];
  publishedAt: Date;
  decisionStatus?: string | null;
}): Promise<Buffer> {
  const src = SRC_LABEL[params.source] ?? { label: "情報", color: "#374151", bg: "#F3F4F6" };
  const bandH = 480;

  const bgPath = COVER_BG_PATH[params.source];
  const bandBgDataUri = bgPath
    ? `data:image/jpeg;base64,${(await sharp(readFileSync(bgPath)).resize(W, bandH, { fit: "cover" }).jpeg().toBuffer()).toString("base64")}`
    : null;

  const titleLines = wrapText(params.title, 15, 3);
  const titleTspans = titleLines
    .map((line, i) => `<tspan x="70" dy="${i === 0 ? 0 : 66}">${escapeXml(line)}</tspan>`)
    .join("");
  const titleBlockBottom = 620 + titleLines.length * 66;

  const tagsSvg = params.tags
    .slice(0, 3)
    .map((tag, i) => {
      const x = 70 + i * 190;
      return `
        <rect x="${x}" y="${titleBlockBottom + 30}" width="170" height="52" rx="26" fill="${src.color}22" stroke="${src.color}" stroke-width="2" />
        <text x="${x + 85}" y="${titleBlockBottom + 64}" font-family="${FONT}" font-size="24" fill="${src.color}" text-anchor="middle">#${escapeXml(tag)}</text>
      `;
    })
    .join("");

  const dateStr = `${params.publishedAt.getMonth() + 1}/${params.publishedAt.getDate()}`;

  const decisionBadge = params.decisionStatus ? DECISION_STATUS_BADGE[params.decisionStatus] : null;
  const topBadges = [
    { label: "新着", bg: "#F5A623", color: "#ffffff" },
    { label: src.label, bg: "rgba(255,255,255,0.92)", color: src.color },
    ...(decisionBadge ? [decisionBadge] : []),
  ];
  const badgeRow = badgeRowSvg(topBadges, 70, 60);

  const { svg: footer, goriIcon } = await footerSvg(src.color);

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#ffffff" />
    <rect x="0" y="0" width="${W}" height="${bandH}" fill="${src.bg ?? "#E8F5F1"}" />
    ${bandBgDataUri ? `<image href="${bandBgDataUri}" x="0" y="0" width="${W}" height="${bandH}" />` : ""}

    ${badgeRow}

    <rect x="${W - 190}" y="60" width="120" height="100" rx="10" fill="${src.color}" />
    <text x="${W - 130}" y="98" font-family="${FONT}" font-size="18" font-weight="700" fill="rgba(255,255,255,0.8)" text-anchor="middle">発表日</text>
    <text x="${W - 130}" y="140" font-family="${FONT}" font-size="32" font-weight="900" fill="#ffffff" text-anchor="middle">${dateStr}</text>

    <text x="70" y="620" font-family="${FONT}" font-size="54" font-weight="900" fill="#1a1a1a">${titleTspans}</text>
    <text x="70" y="${titleBlockBottom - 10}" font-family="${FONT}" font-size="22" fill="#999999">${escapeXml(params.subtitle.slice(0, 40))}</text>

    ${tagsSvg}

    ${footer}
  </svg>`;

  return sharp(Buffer.from(svg))
    .composite([{ input: goriIcon, top: H - 90 - 55, left: 40 }])
    .png()
    .toBuffer();
}

// ── ② 3行まとめカード ────────────────────────────────────────────────────
export async function generateSummaryCardImage(params: {
  source: string;
  points: string[];
}): Promise<Buffer> {
  const src = SRC_LABEL[params.source] ?? { label: "情報", color: "#374151", bg: "#F3F4F6" };
  const pointLines = params.points.slice(0, 3);

  const pointsSvg = pointLines
    .map((p, i) => {
      const wrapped = wrapText(p, 20, 3);
      const y = 260 + i * 220;
      const pTspans = wrapped
        .map((line, j) => `<tspan x="170" dy="${j === 0 ? 0 : 44}">${escapeXml(line)}</tspan>`)
        .join("");
      return `
        <circle cx="115" cy="${y - 8}" r="32" fill="${i === 0 ? src.color : "#E5E7EB"}" />
        <text x="115" y="${y + 4}" font-family="${FONT}" font-size="32" font-weight="900" fill="${i === 0 ? "#ffffff" : "#666666"}" text-anchor="middle">${i + 1}</text>
        <text x="170" y="${y}" font-family="${FONT}" font-size="${i === 0 ? 34 : 30}" font-weight="${i === 0 ? 800 : 600}" fill="#1a1a1a">${pTspans}</text>
      `;
    })
    .join("");

  const { svg: footer, goriIcon } = await footerSvg(src.color);

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="#F7FAF9" />
    <rect x="0" y="0" width="${W}" height="150" fill="${src.color}" />
    <text x="70" y="90" font-family="${FONT}" font-size="40" font-weight="800" fill="#ffffff">3行まとめ</text>

    ${pointsSvg}

    ${footer}
  </svg>`;

  return sharp(Buffer.from(svg))
    .composite([{ input: goriIcon, top: H - 90 - 55, left: 40 }])
    .png()
    .toBuffer();
}

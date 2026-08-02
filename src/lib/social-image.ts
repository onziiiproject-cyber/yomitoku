import sharp from "sharp";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";

// sharpのSVGレンダラー（librsvg経由のPango）はOSのfontconfigでフォントを探すため、
// Vercelのサーバーレス環境には日本語フォントが1つも入っておらず、そのままだと文字が
// 全く描画されない（豆腐文字にすらならず空白になる）。同梱フォントを指すfontconfig設定を
// /tmp に生成してFONTCONFIG_PATHで読み込ませることで、環境を問わず確実に描画させる。
let fontconfigReady = false;
function ensureFontconfig() {
  if (fontconfigReady) return;
  const fontDir = path.join(process.cwd(), "public/fonts");
  const confDir = "/tmp/fontconfig";
  const cacheDir = "/tmp/fontconfig/cache";
  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
  const confPath = path.join(confDir, "fonts.conf");
  if (!existsSync(confPath)) {
    writeFileSync(
      confPath,
      `<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n<fontconfig>\n  <dir>${fontDir}</dir>\n  <cachedir>${cacheDir}</cachedir>\n</fontconfig>\n`
    );
  }
  process.env.FONTCONFIG_PATH = confDir;
  fontconfigReady = true;
}

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

const FONT = "Noto Sans JP, sans-serif";
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
  ensureFontconfig();
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
  ensureFontconfig();
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

// ── 週刊ヨミトク：個別通知カードのヒーロー画像 ─────────────────────────────
// LINE Flexのbox/textだけでは「タイトル文字がキャラに回り込む」「行間調整」
// 「フォントサイズの細かい指定」ができないため、それらを画像側に焼き込む。
const CARD_ICON_PATH: Record<string, string> = {
  mhlw_latest: path.join(process.cwd(), "public/LP_sozai/assets/icons/icon-document.png"),
  shingi: path.join(process.cwd(), "public/LP_sozai/assets/icons/icon-lightbulb.png"),
};
const CARD_CHARACTER_PATH: Record<string, string> = {
  mhlw_latest: path.join(process.cwd(), "public/LP_sozai/assets/mascot/misugray-clipboard.png"),
  shingi: path.join(process.cwd(), "public/LP_sozai/assets/mascot/gori-thinking.png"),
};
const CARD_BG_PATH: Record<string, string> = {
  mhlw_latest: path.join(process.cwd(), "public/LP_sozai/assets/backgrounds/card-bg-green.png"),
  shingi: path.join(process.cwd(), "public/LP_sozai/assets/backgrounds/card-bg-blue.png"),
};
// ユーザー提供モックアップから実測した色（既存のSRC_LABELはSNS投稿用カードと共有のため、
// ここでは別テーマとして定義し他のカード種別に影響させない）
const WEEKLY_HERO_COLOR: Record<string, string> = {
  mhlw_latest: "#1E6F4A",
  shingi: "#1D4B98",
};

function starPolygonPoints(cx: number, cy: number, rOuter: number, rInner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 180) * (-90 + i * 36);
    const r = i % 2 === 0 ? rOuter : rInner;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

// 重要度/緊急度を1行にまとめた白背景ピル（縦の区切り線で2項目を並べる）
function statPillSvg(x: number, y: number, color: string, label: string, stars: number | null, iconKind: "star" | "alert"): { svg: string; width: number } {
  const starLine = stars ? "★".repeat(stars) + "☆".repeat(5 - stars) : "";
  const icon =
    iconKind === "star"
      ? `<polygon points="${starPolygonPoints(x + 30, y + 32, 11, 4.5)}" fill="${color}" />`
      : `<text x="${x + 30}" y="${y + 40}" font-family="${FONT}" font-size="26" font-weight="900" fill="${color}" text-anchor="middle">!</text>`;
  const width = 60 + label.length * 32 + starLine.length * 26 + 20;
  return {
    width,
    svg: `
      <circle cx="${x + 30}" cy="${y + 32}" r="17" fill="#ffffff" stroke="${color}" stroke-width="2.5" />
      ${icon}
      <text x="${x + 60}" y="${y + 42}" font-family="${FONT}" font-size="28" font-weight="800" fill="#444444">${escapeXml(label)}</text>
      <text x="${x + 60 + label.length * 32}" y="${y + 42}" font-family="${FONT}" font-size="30" fill="#F5A623">${starLine}</text>
    `,
  };
}

export async function generateWeeklyCardHeroImage(params: {
  source: string;
  title: string;
  decisionStatus?: string | null;
  importanceStars: number | null;
  urgencyStars: number | null;
}): Promise<Buffer> {
  ensureFontconfig();
  const src = SRC_LABEL[params.source] ?? { label: params.source, color: "#374151", bg: "#F3F4F6" };
  const heroColor = WEEKLY_HERO_COLOR[params.source] ?? src.color;
  const iconPath = CARD_ICON_PATH[params.source];
  const characterPath = CARD_CHARACTER_PATH[params.source];
  const bgPath = CARD_BG_PATH[params.source];
  const decisionBadge = params.decisionStatus ? DECISION_STATUS_BADGE[params.decisionStatus] : null;

  const HERO_H = 780;

  const bgDataUri = bgPath
    ? `data:image/png;base64,${(await sharp(readFileSync(bgPath)).resize(W, HERO_H, { fit: "cover" }).png().toBuffer()).toString("base64")}`
    : null;
  const iconDataUri = iconPath
    ? `data:image/png;base64,${(await sharp(readFileSync(iconPath)).resize(48, 48, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()).toString("base64")}`
    : null;
  const characterDataUri = characterPath
    ? `data:image/png;base64,${(await sharp(readFileSync(characterPath)).resize(400, 400, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()).toString("base64")}`
    : null;

  const typeBadgeWidth = src.label.length * 30 + 130;
  const decisionBadgeWidth = decisionBadge ? decisionBadge.label.length * 28 + 70 : 0;

  const titleLines = wrapText(params.title, 10, 3);
  const titleTspans = titleLines
    .map((line, i) => `<tspan x="60" dy="${i === 0 ? 0 : 68}">${escapeXml(line)}</tspan>`)
    .join("");

  const pillY = 560;
  const importancePill = params.importanceStars
    ? statPillSvg(60, pillY, heroColor, "重要度", params.importanceStars, "star")
    : null;
  const urgencyPill = params.urgencyStars
    ? statPillSvg(60 + (importancePill?.width ?? 0) + 40, pillY, "#E4572E", "緊急度", params.urgencyStars, "alert")
    : null;
  const pillsTotalWidth = (importancePill?.width ?? 0) + (urgencyPill ? 40 + urgencyPill.width : 0);

  const svg = `<svg width="${W}" height="${HERO_H}" xmlns="http://www.w3.org/2000/svg">
    ${bgDataUri ? `<image href="${bgDataUri}" x="0" y="0" width="${W}" height="${HERO_H}" />` : `<rect x="0" y="0" width="${W}" height="${HERO_H}" fill="${src.bg ?? "#F3F4F6"}" />`}

    <rect x="60" y="60" width="${typeBadgeWidth}" height="96" rx="48" fill="${heroColor}" />
    <circle cx="${60 + 68}" cy="${60 + 48}" r="34" fill="#ffffff" />
    ${iconDataUri ? `<image href="${iconDataUri}" x="${60 + 68 - 24}" y="${60 + 48 - 24}" width="48" height="48" />` : ""}
    <text x="${60 + 68 + 34 + 18}" y="${60 + 48 + 13}" font-family="${FONT}" font-size="34" font-weight="800" fill="#ffffff">${escapeXml(src.label)}</text>

    ${
      decisionBadge
        ? `<rect x="${W - 60 - decisionBadgeWidth}" y="72" width="${decisionBadgeWidth}" height="72" rx="36" fill="#ffffff" stroke="${heroColor}" stroke-width="3" />
           <text x="${W - 60 - decisionBadgeWidth / 2}" y="118" font-family="${FONT}" font-size="28" font-weight="800" fill="${heroColor}" text-anchor="middle">${escapeXml(decisionBadge.label)}</text>`
        : ""
    }

    <text x="60" y="270" font-family="${FONT}" font-size="52" font-weight="900" fill="#14171f">${titleTspans}</text>

    ${characterDataUri ? `<image href="${characterDataUri}" x="${W - 440}" y="160" width="400" height="400" />` : ""}

    ${pillsTotalWidth > 0 ? `<rect x="44" y="${pillY - 16}" width="${pillsTotalWidth + 32}" height="80" rx="40" fill="rgba(255,255,255,0.94)" />` : ""}
    ${importancePill?.svg ?? ""}
    ${urgencyPill?.svg ?? ""}
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ── ③ 放送室エピソード告知カード ───────────────────────────────────────────
const PODCAST_COVER_PATH = path.join(process.cwd(), "public/podcast/cover.png");

export async function generatePodcastEpisodeCardImage(params: {
  episodeNo: number;
  title: string;
}): Promise<Buffer> {
  ensureFontconfig();

  const coverDataUri = `data:image/png;base64,${(await sharp(readFileSync(PODCAST_COVER_PATH)).resize(W, W).toBuffer()).toString("base64")}`;
  const titleLines = wrapText(params.title, 15, 3);
  const titleTspans = titleLines
    .map((line, i) => `<tspan x="70" dy="${i === 0 ? 0 : 60}">${escapeXml(line)}</tspan>`)
    .join("");
  const titleBlockHeight = titleLines.length * 60;
  const titleY = H - 140 - titleBlockHeight;

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <image href="${coverDataUri}" x="0" y="0" width="${W}" height="${W}" />

    <defs>
      <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000000" stop-opacity="0" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.78" />
      </linearGradient>
    </defs>
    <rect x="0" y="${H - 460}" width="${W}" height="460" fill="url(#fade)" />

    <rect x="70" y="${H - 410}" width="220" height="52" rx="26" fill="#F5A623" />
    <text x="180" y="${H - 374}" font-family="${FONT}" font-size="26" font-weight="800" fill="#ffffff" text-anchor="middle">配信中 🎙</text>

    <text x="70" y="${titleY}" font-family="${FONT}" font-size="52" font-weight="900" fill="#ffffff">${titleTspans}</text>

    <text x="70" y="${H - 55}" font-family="${FONT}" font-size="26" font-weight="700" fill="#ffffff">プロフィール欄のリンクから聴く →</text>
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

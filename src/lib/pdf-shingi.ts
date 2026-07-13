import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShingiTheme {
  no: number;
  name: string;
  short_desc: string;
  icon: string;
  color: string;
}

export interface ShingiThemeDetail {
  no: number;
  category: string;
  name: string;
  overview: string;
  stats: Array<{ value: string; label: string }>;
  ai_comment: string;
  revision_points: Array<{ title: string; desc: string; ref: string }>;
  issues: Array<{ desc: string; value: string; note: string; ref: string }>;
  opinions: Array<{ title: string; desc: string; ref: string }>;
  impact_stars: number;
  related_roles: string[];
  source_label: string;
  source_url?: string;
}

export interface ShingiPDFData {
  meta: {
    council_name: string;
    session_no: number;
    date: string;
    feature_label: string;
  };
  themes: ShingiTheme[];
  summary: {
    lead: string;
    body: string;
    keywords: Array<{ label: string; desc: string; icon: string }>;
  };
  theme_details: ShingiThemeDetail[];
}

// ─── Design Tokens ────────────────────────────────────────────────────────────

const THEME_COLORS: Record<string, { main: string; light: string }> = {
  teal:     { main: "#1B9C8E", light: "#E8F7F5" },
  darkteal: { main: "#2E7D8C", light: "#E4EFF2" },
  olive:    { main: "#7FA33B", light: "#EFF5E2" },
  blue:     { main: "#3E7CB1", light: "#E4EEF6" },
  purple:   { main: "#6B5EA8", light: "#EEEAF7" },
  orange:   { main: "#E07B39", light: "#FAF0E6" },
};
const COLOR_KEYS = Object.keys(THEME_COLORS);

function tc(color: string, idx?: number): { main: string; light: string } {
  if (THEME_COLORS[color]) return THEME_COLORS[color];
  const key = COLOR_KEYS[(idx ?? 0) % COLOR_KEYS.length];
  return THEME_COLORS[key];
}

// ─── Assets ───────────────────────────────────────────────────────────────────

function assetBase64(relativePath: string, mime = "image/png"): string {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), relativePath));
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return "";
  }
}

// ─── SVG helpers ─────────────────────────────────────────────────────────────

function icon(name: string, color = "#1B9C8E", size = 28): string {
  const s = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  switch (name) {
    case "house":    return `<svg ${s}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
    case "nurse":    return `<svg ${s}><circle cx="12" cy="7" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/><line x1="12" y1="11" x2="12" y2="15"/><line x1="10" y1="13" x2="14" y2="13"/></svg>`;
    case "group":    return `<svg ${s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
    case "clipboard":return `<svg ${s}><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg>`;
    case "heart":    return `<svg ${s}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
    case "brain":    return `<svg ${s}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2z"/></svg>`;
    case "chart":    return `<svg ${s}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 16v-4M12 16V9M16 16v-6"/></svg>`;
    case "person":   return `<svg ${s}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`;
    case "pin":      return `<svg ${s}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`;
    case "star":     return `<svg ${s}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    case "warning":  return `<svg ${s}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    case "chat":     return `<svg ${s}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    case "calendar": return `<svg ${s}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
    case "bookmark": return `<svg ${s}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
    case "building": return `<svg ${s}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`;
    case "doc":      return `<svg ${s}><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>`;
    default:         return `<svg ${s}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  }
}

// ─── Common components ────────────────────────────────────────────────────────

function headerLogo(logoB64: string): string {
  if (logoB64) {
    return `<img src="${logoB64}" style="height:52px;width:auto;object-fit:contain;" />`;
  }
  return `<div style="display:flex;align-items:center;gap:10px;">
    <div style="font-size:22px;font-weight:800;color:#1B9C8E;">ヨミトク</div>
    <div style="font-size:11px;color:#5A6266;">介護保険最新情報</div>
  </div>`;
}

function disclaimer(): string {
  return `<div style="display:flex;align-items:center;gap:10px;padding:12px 20px;background:#F0F5F4;border-radius:10px;">
    <div style="width:20px;height:20px;border-radius:50%;border:2px solid #1B9C8E;color:#1B9C8E;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">i</div>
    <div style="font-size:14px;color:#5A6266;">※ 厚生労働省 公開資料をもとにした自動要約です。正式な内容は原資料でご確認ください。</div>
  </div>`;
}

function stars(n: number, max = 5): string {
  return Array.from({ length: max }, (_, i) =>
    `<span style="color:${i < n ? "#1B9C8E" : "#D0D8D6"};font-size:22px;line-height:1;">★</span>`
  ).join("");
}

// ─── Page A: 表紙 ────────────────────────────────────────────────────────────

function pageA(data: ShingiPDFData, illustB64: string, logoB64: string): string {
  const { meta, themes } = data;

  const themeCards = themes.map((t, i) => {
    const { main, light } = tc(t.color, i);
    return `<div style="flex:1;min-width:0;display:flex;align-items:center;gap:18px;background:${light};border-radius:18px;padding:20px 24px;">
      <div style="width:60px;height:60px;border-radius:50%;background:${main};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        ${icon(t.icon, "#ffffff", 30)}
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:15px;color:${main};font-weight:700;letter-spacing:0.06em;margin-bottom:4px;">THEME ${String(t.no).padStart(2, "0")}</div>
        <div style="font-size:24px;font-weight:800;color:#1A1A1A;line-height:1.3;">${t.name}</div>
      </div>
    </div>`;
  }).join("");

  return `<div class="page" style="width:1920px;height:1080px;background:linear-gradient(140deg,#F5FDFB 0%,#E4F5F1 100%);position:relative;display:flex;font-family:'Noto Sans JP',sans-serif;overflow:hidden;">
    <div style="position:absolute;left:960px;top:-200px;width:800px;height:800px;background:radial-gradient(circle,rgba(27,156,142,0.10),transparent);border-radius:50%;pointer-events:none;z-index:0;"></div>

    <div style="width:1120px;flex-shrink:0;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between;z-index:1;">

      <img src="${logoB64}" style="height:64px;width:auto;object-fit:contain;align-self:flex-start;" />

      <div style="display:inline-flex;align-items:center;gap:14px;background:#1B9C8E;color:#ffffff;padding:16px 32px;border-radius:999px;font-size:24px;font-weight:700;width:fit-content;">
        ${icon("building", "#ffffff", 24)}
        ${meta.council_name}
      </div>

      <div>
        <div style="font-size:104px;font-weight:900;color:#1A1A1A;line-height:1.0;">第${meta.session_no}回</div>
        <div style="font-size:144px;font-weight:900;color:#1A1A1A;line-height:1.0;">かんたん解説</div>
        <div style="width:88px;height:7px;background:#1B9C8E;border-radius:4px;margin-top:24px;"></div>
      </div>

      <div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:12px;color:#5A6266;font-size:28px;">
          ${icon("calendar", "#5A6266", 28)}
          開催日：${meta.date}
        </div>
        <div style="display:inline-flex;align-items:center;gap:12px;background:#E8F7F5;color:#1B9C8E;padding:14px 30px;border-radius:999px;font-size:26px;font-weight:700;">
          ${icon("bookmark", "#1B9C8E", 26)}
          ${meta.feature_label}
        </div>
      </div>

      <div style="display:flex;gap:20px;">
        ${themeCards}
      </div>
    </div>

    <div style="flex:1;position:relative;overflow:hidden;">
      ${illustB64
        ? `<img src="${illustB64}" style="width:100%;height:100%;object-fit:cover;object-position:left center;" />`
        : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#C8EDE8,#E8F7F5);display:flex;align-items:center;justify-content:center;color:#1B9C8E;font-size:28px;">イラスト</div>`
      }
    </div>
  </div>`;
}

// ─── Page B: 全体サマリー ─────────────────────────────────────────────────────

function pageB(data: ShingiPDFData, logoB64: string): string {
  const { meta, themes, summary } = data;

  const kwItems = summary.keywords.map(k => `
    <div style="display:flex;align-items:flex-start;gap:12px;">
      <div style="width:38px;height:38px;border-radius:50%;background:#E8F7F5;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        ${icon(k.icon, "#1B9C8E", 18)}
      </div>
      <div>
        <div style="font-size:17px;font-weight:700;color:#1A1A1A;">${k.label}</div>
        <div style="font-size:14px;color:#5A6266;margin-top:2px;line-height:1.5;">${k.desc}</div>
      </div>
    </div>
  `).join("");

  const themeCards = themes.map((t, i) => {
    const { main, light } = tc(t.color, i);
    return `<div style="flex:1;background:${light};border-radius:16px;padding:20px 16px;position:relative;text-align:center;">
      <div style="position:absolute;top:10px;left:10px;width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,0.85);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:${main};">0${t.no}</div>
      <div style="display:flex;justify-content:center;margin:16px 0 10px;">
        <div style="width:60px;height:60px;border-radius:50%;background:${main};display:flex;align-items:center;justify-content:center;">
          ${icon(t.icon, "#ffffff", 28)}
        </div>
      </div>
      <div style="font-size:17px;font-weight:700;color:${main};margin-bottom:6px;">${t.name}</div>
      <div style="font-size:13px;color:#5A6266;line-height:1.5;">${t.short_desc}</div>
      <div style="border-top:2px dashed ${main}44;margin-top:12px;"></div>
    </div>`;
  }).join("");

  const leadHighlighted = summary.lead.replace(
    /(\d+つの|\d+つ)/g,
    `<span style="color:#1B9C8E;font-size:30px;font-weight:900;">$1</span>`
  );

  return `<div class="page" style="width:1920px;height:1080px;background:#FBFDFC;display:flex;flex-direction:column;font-family:'Noto Sans JP',sans-serif;overflow:hidden;padding:52px 72px;box-sizing:border-box;gap:24px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:18px;">
        <div style="width:60px;height:60px;border-radius:50%;background:#1B9C8E;display:flex;align-items:center;justify-content:center;">
          ${icon("doc", "#ffffff", 28)}
        </div>
        <div>
          <div style="font-size:36px;font-weight:800;color:#1A1A1A;">第${meta.session_no}回のポイント</div>
          <div style="width:48px;height:3px;background:#1B9C8E;border-radius:2px;margin-top:6px;"></div>
        </div>
      </div>
      ${headerLogo(logoB64)}
    </div>

    <div style="background:#ffffff;border-radius:20px;padding:28px 36px;border:1.5px solid #E7EEEC;display:flex;gap:36px;flex:1;min-height:0;overflow:hidden;">
      <div style="flex:1.4;display:flex;flex-direction:column;gap:14px;">
        <div style="font-size:25px;font-weight:800;color:#1A1A1A;line-height:1.5;">${leadHighlighted}</div>
        <div style="font-size:18px;color:#4A4A4A;line-height:1.8;">${summary.body}</div>
      </div>
      <div style="width:1.5px;background:#E7EEEC;flex-shrink:0;"></div>
      <div style="flex:0.8;display:flex;flex-direction:column;gap:16px;">
        <div style="font-size:16px;font-weight:700;color:#1B9C8E;">今回のキーワード</div>
        ${kwItems}
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:16px;">
      <div style="flex:1;height:1px;background:#E7EEEC;"></div>
      <div style="font-size:16px;font-weight:700;color:#5A6266;">議論された${themes.length}つのテーマ</div>
      <div style="flex:1;height:1px;background:#E7EEEC;"></div>
    </div>

    <div style="display:flex;gap:18px;">
      ${themeCards}
    </div>

    ${disclaimer()}
  </div>`;
}

// ─── Page C: テーマ概要 ───────────────────────────────────────────────────────

function pageC(data: ShingiPDFData, detail: ShingiThemeDetail, logoB64: string): string {
  const theme = data.themes.find(t => t.no === detail.no);
  const { main, light } = tc(theme?.color ?? "teal", detail.no - 1);
  const ico = theme?.icon ?? "clipboard";

  const statCards = detail.stats.slice(0, 3).map(s => `
    <div style="flex:1;background:#F7F9F8;border-radius:12px;padding:16px 18px;display:flex;align-items:center;gap:12px;min-width:0;">
      <div style="width:40px;height:40px;border-radius:50%;background:${main};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        ${icon(ico, "#ffffff", 18)}
      </div>
      <div style="min-width:0;">
        <div style="font-size:30px;font-weight:800;color:${main};line-height:1;">${s.value}</div>
        <div style="font-size:13px;color:#5A6266;margin-top:4px;line-height:1.4;">${s.label}</div>
      </div>
    </div>
  `).join("");

  const revItems = detail.revision_points.slice(0, 5).map((r, i) => `
    <div style="display:flex;gap:12px;align-items:flex-start;">
      <div style="width:26px;height:26px;border-radius:50%;background:${main};color:#ffffff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">0${i + 1}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:16px;font-weight:700;color:${main};line-height:1.4;">${r.title}</div>
        <div style="font-size:14px;color:#4A4A4A;margin-top:3px;line-height:1.5;">${r.desc}${r.ref ? ` <span style="color:#8A9498;font-size:12px;">(${r.ref})</span>` : ""}</div>
      </div>
    </div>
  `).join("");

  return `<div class="page" style="width:1920px;height:1080px;background:#FBFDFC;display:flex;flex-direction:column;font-family:'Noto Sans JP',sans-serif;overflow:hidden;padding:48px 64px;box-sizing:border-box;gap:22px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="width:60px;height:60px;border-radius:50%;background:${main};display:flex;align-items:center;justify-content:center;">
          ${icon(ico, "#ffffff", 28)}
        </div>
        <div>
          <div style="font-size:15px;color:#5A6266;font-weight:600;">${detail.category}　|　${detail.name}</div>
          <div style="font-size:36px;font-weight:800;color:#1A1A1A;line-height:1.2;">サービス概要と対象者像</div>
        </div>
      </div>
      ${headerLogo(logoB64)}
    </div>

    <div style="display:flex;gap:28px;flex:1;min-height:0;overflow:hidden;">
      <div style="flex:1.3;display:flex;flex-direction:column;gap:18px;overflow:hidden;">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <div style="background:${main};color:#ffffff;padding:5px 14px;border-radius:999px;font-size:14px;font-weight:700;">${detail.category}</div>
          <div style="font-size:21px;font-weight:800;color:#1A1A1A;">${detail.name}</div>
        </div>
        <div style="font-size:17px;color:#4A4A4A;line-height:1.85;flex:1;overflow:hidden;">${detail.overview}</div>
        ${detail.stats.length > 0 ? `<div style="display:flex;gap:14px;">${statCards}</div>` : ""}
        <div style="background:#F7F9F8;border-radius:14px;padding:16px 22px;display:flex;align-items:flex-start;gap:12px;">
          <div style="width:34px;height:34px;border-radius:50%;background:#1B9C8E;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${icon("star", "#ffffff", 16)}
          </div>
          <div>
            <div style="font-size:13px;font-weight:700;color:#1B9C8E;margin-bottom:5px;">AIコメント</div>
            <div style="font-size:16px;color:#4A4A4A;line-height:1.7;">${detail.ai_comment}</div>
          </div>
        </div>
      </div>

      <div style="width:1.5px;background:#E7EEEC;flex-shrink:0;"></div>

      <div style="flex:0.9;display:flex;flex-direction:column;gap:14px;overflow:hidden;">
        <div style="display:flex;align-items:center;gap:10px;">
          ${icon("doc", main, 18)}
          <div style="font-size:19px;font-weight:800;color:#1A1A1A;">令和６年度 報酬改定のポイント</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;overflow:hidden;">
          ${detail.revision_points.length > 0 ? revItems : `<div style="font-size:16px;color:#8A9498;">準備中</div>`}
        </div>
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:8px;font-size:15px;color:${main};">
      ${icon("doc", main, 16)}
      出典：${detail.source_label}を開く ↗
    </div>
  </div>`;
}

// ─── Page D: 課題・意見 ───────────────────────────────────────────────────────

function pageD(data: ShingiPDFData, detail: ShingiThemeDetail, logoB64: string): string {
  const theme = data.themes.find(t => t.no === detail.no);
  const { main, light } = tc(theme?.color ?? "teal", detail.no - 1);
  const ico = theme?.icon ?? "clipboard";

  const issueItems = detail.issues.slice(0, 4).map(iss => `
    <div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #F0F5F4;">
      <div style="width:34px;height:34px;border-radius:50%;background:#FAEAE9;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        ${icon("warning", "#E4574C", 16)}
      </div>
      <div style="flex:1;font-size:16px;color:#4A4A4A;line-height:1.6;">
        ${iss.desc}
        ${iss.value ? `<span style="font-size:22px;font-weight:800;color:#E4574C;margin:0 3px;">${iss.value}</span>` : ""}
        ${iss.note ? `<span>${iss.note}</span>` : ""}
        ${iss.ref ? `<span style="font-size:12px;color:#8A9498;margin-left:4px;">(${iss.ref})</span>` : ""}
      </div>
    </div>
  `).join("");

  const opinionItems = detail.opinions.slice(0, 4).map(op => `
    <div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #F0F5F4;">
      <div style="width:34px;height:34px;border-radius:50%;background:${light};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        ${icon("chat", main, 16)}
      </div>
      <div style="flex:1;">
        <div style="font-size:16px;font-weight:700;color:#1A1A1A;line-height:1.4;">${op.title}</div>
        <div style="font-size:14px;color:#5A6266;margin-top:3px;line-height:1.5;">${op.desc}${op.ref ? ` <span style="color:#8A9498;font-size:12px;">(${op.ref})</span>` : ""}</div>
      </div>
    </div>
  `).join("");

  const roleTags = detail.related_roles.map(r => `
    <div style="display:inline-flex;align-items:center;gap:5px;background:#E8F7F5;color:#1B9C8E;padding:5px 12px;border-radius:999px;font-size:13px;font-weight:600;">
      ${icon("person", "#1B9C8E", 13)}
      ${r}
    </div>
  `).join("");

  const leadText = detail.overview.split("。").slice(0, 2).join("。") + "。";

  return `<div class="page" style="width:1920px;height:1080px;background:#FBFDFC;display:flex;flex-direction:column;font-family:'Noto Sans JP',sans-serif;overflow:hidden;padding:48px 64px;box-sizing:border-box;gap:20px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="width:60px;height:60px;border-radius:50%;background:${main};display:flex;align-items:center;justify-content:center;">
          ${icon(ico, "#ffffff", 28)}
        </div>
        <div>
          <div style="font-size:15px;color:#5A6266;font-weight:600;">${detail.category}　|　${detail.name}</div>
          <div style="font-size:34px;font-weight:800;color:#1A1A1A;">現状の課題と、委員からの意見</div>
        </div>
      </div>
      ${headerLogo(logoB64)}
    </div>

    <div style="font-size:18px;color:#4A4A4A;line-height:1.8;">${leadText}</div>

    <div style="display:flex;gap:22px;flex:1;min-height:0;overflow:hidden;">
      <div style="flex:1;background:#ffffff;border-radius:18px;border:1.5px solid #E7EEEC;padding:22px 26px;overflow:hidden;display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <div style="width:34px;height:34px;border-radius:50%;background:#FAEAE9;display:flex;align-items:center;justify-content:center;">
            ${icon("warning", "#E4574C", 16)}
          </div>
          <div style="font-size:20px;font-weight:800;color:#E4574C;">現状の課題</div>
        </div>
        ${detail.issues.length > 0 ? issueItems : `<div style="font-size:16px;color:#8A9498;margin-top:8px;">準備中</div>`}
      </div>

      <div style="flex:1;background:#ffffff;border-radius:18px;border:1.5px solid #E7EEEC;padding:22px 26px;overflow:hidden;display:flex;flex-direction:column;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <div style="width:34px;height:34px;border-radius:50%;background:${light};display:flex;align-items:center;justify-content:center;">
            ${icon("chat", main, 16)}
          </div>
          <div style="font-size:20px;font-weight:800;color:${main};">委員の意見・今後の方向性</div>
        </div>
        ${detail.opinions.length > 0 ? opinionItems : `<div style="font-size:16px;color:#8A9498;margin-top:8px;">準備中</div>`}
      </div>
    </div>

    <div style="background:#F7F9F8;border-radius:14px;padding:24px 32px;display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
      <div style="display:flex;align-items:flex-start;gap:10px;flex:1.5;min-width:0;">
        <div style="width:30px;height:30px;border-radius:50%;background:#1B9C8E;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
          ${icon("star", "#ffffff", 14)}
        </div>
        <div style="min-width:0;">
          <div style="font-size:12px;font-weight:700;color:#1B9C8E;margin-bottom:3px;">AIコメント</div>
          <div style="font-size:15px;color:#4A4A4A;line-height:1.6;">${detail.ai_comment}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex-shrink:0;">
        <div style="font-size:12px;color:#5A6266;font-weight:600;">経営者への影響</div>
        <div>${stars(detail.impact_stars)}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0;">
        <div style="font-size:12px;color:#5A6266;font-weight:600;">特に確認したい方</div>
        <div style="display:flex;gap:7px;flex-wrap:wrap;">${roleTags}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:13px;color:${main};margin-left:auto;flex-shrink:0;">
        ${icon("doc", main, 13)}
        出典：${detail.source_label}を開く ↗
      </div>
    </div>
  </div>`;
}

// ─── HTML wrapper ─────────────────────────────────────────────────────────────

function wrapHTML(pages: string[]): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
@page { size: 1920px 1080px; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; background: #eee; }
.page { page-break-after: always; page-break-inside: avoid; }
.page:last-child { page-break-after: auto; }
</style>
</head>
<body>${pages.join("\n")}</body>
</html>`;
}

// ─── Puppeteer render ─────────────────────────────────────────────────────────

async function renderPDF(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "load", timeout: 30000 });
    await page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready);
    await new Promise(r => setTimeout(r, 1500));
    const pdf = await page.pdf({
      width: "1920px",
      height: "1080px",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export async function generateShingiCoverPDF(data: ShingiPDFData): Promise<Buffer> {
  const illustB64 = assetBase64("design/かんたん解説表紙イラスト.jpg", "image/jpeg");
  const logoB64 = assetBase64("public/icons/logo-line-compact.png", "image/png");
  return renderPDF(wrapHTML([pageA(data, illustB64, logoB64), pageB(data, logoB64)]));
}

export async function generateShingiTopicPDF(data: ShingiPDFData, themeNo: number): Promise<Buffer> {
  const detail = data.theme_details.find(d => d.no === themeNo);
  if (!detail) throw new Error(`Theme ${themeNo} not found`);
  const logoB64 = assetBase64("public/icons/logo-line-compact.png", "image/png");
  return renderPDF(wrapHTML([pageC(data, detail, logoB64), pageD(data, detail, logoB64)]));
}

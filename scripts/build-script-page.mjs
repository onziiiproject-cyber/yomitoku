/**
 * 未収録（DRAFT）の議事録ラジオ解説の台本を、1枚のHTMLに書き出す。
 * 台本はDBにしかなく、ターミナル出力は読みにくいので、レビューはこのページで行う。
 *
 * Usage:
 *   npx tsx scripts/build-script-page.mjs            # DRAFTをまとめて1枚に
 *   npx tsx scripts/build-script-page.mjs --all      # PUBLISHED済みも含める
 *   npx tsx scripts/build-script-page.mjs --out <path>
 *
 * 出力（既定）: ./tmp/台本まとめ.html
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split("\n").filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const [k, ...r] = l.split("="); return [k.trim(), r.join("=").trim().replace(/^["']|["']$/g, "")]; })
);
for (const [k, v] of Object.entries(env)) process.env[k] ??= v;

const args = process.argv.slice(2);
const getOpt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const showAll = args.includes("--all");
const outFile = path.resolve(getOpt("--out") ?? path.join(ROOT, "tmp/台本まとめ.html"));

const { prisma } = await import("../src/lib/prisma.ts");

const briefings = await prisma.articleAudioBriefing.findMany({
  where: showAll ? {} : { status: "DRAFT" },
  orderBy: { createdAt: "desc" },
  include: { siteDocument: { select: { title: true } } },
});
await prisma.$disconnect();

if (briefings.length === 0) {
  console.log("対象の台本がありません。");
  process.exit(0);
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const chars = (lines) => lines.reduce((n, l) => n + l.text.length, 0);

const sections = briefings.map((b, i) => {
  const script = b.script ?? [];
  const rows = script.map((l, n) => {
    const who = l.speaker === "gori" ? "ゴリ編集長" : "ミスグレー";
    return `<tr class="${l.speaker}"><td class="n">${n + 1}</td><td class="who">${who}</td><td class="t">${esc(l.text)}</td></tr>`;
  }).join("\n");
  return `<section id="s${i}">
<h2>${esc(b.title)}<span class="badge">${b.status}</span></h2>
<p class="meta">元記事: ${esc(b.siteDocument?.title ?? "-")}<br>
本編 ${script.length}行 / ${chars(script)}字　|　id: <code>${b.id}</code></p>
<p class="desc">${esc(b.description)}</p>
<table>${rows}</table>
</section>`;
}).join("\n");

const toc = briefings.map((b, i) => `<li><a href="#s${i}">${esc(b.title)}</a></li>`).join("");

const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>議事録ラジオ解説 台本</title>
<style>
:root { color-scheme: light dark; --fg:#1a1a1a; --bg:#fff; --muted:#666; --line:#e5e5e5; --gori:#f3f7ff; --gray:#fdf6f0; }
@media (prefers-color-scheme: dark) { :root { --fg:#e8e8e8; --bg:#161616; --muted:#9a9a9a; --line:#333; --gori:#1b2333; --gray:#2a2118; } }
body { margin:0; padding:2rem 1.25rem 5rem; font-family:-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif;
  line-height:1.85; color:var(--fg); background:var(--bg); max-width:900px; margin-inline:auto; }
h1 { font-size:1.5rem; margin:0 0 .25rem; }
h2 { font-size:1.2rem; margin:3rem 0 .5rem; padding-top:1.5rem; border-top:2px solid var(--line); }
.badge { font-size:.65rem; font-weight:600; color:var(--muted); border:1px solid var(--line); border-radius:4px; padding:.1rem .4rem; margin-left:.6rem; vertical-align:middle; }
.lead { color:var(--muted); font-size:.9rem; margin:0 0 2rem; }
.meta { color:var(--muted); font-size:.82rem; margin:.25rem 0; }
.desc { background:var(--gori); padding:.75rem 1rem; border-radius:8px; font-size:.9rem; margin:1rem 0 1.5rem; }
nav ol { padding-left:1.2rem; margin:0; } nav a { color:inherit; }
table { border-collapse:collapse; width:100%; }
td { padding:.6rem .7rem; vertical-align:top; border-bottom:1px solid var(--line); }
td.n { width:2.2rem; text-align:right; color:var(--muted); font-size:.78rem; font-variant-numeric:tabular-nums; }
td.who { width:6.5rem; white-space:nowrap; font-size:.82rem; font-weight:600; color:var(--muted); }
td.t { font-size:.95rem; }
tr.gori { background:var(--gori); } tr.gray { background:var(--gray); }
code { font-size:.8em; }
</style></head><body>
<h1>議事録ラジオ解説 台本（${briefings.length}本）</h1>
<p class="lead">合成は <code>synthesize-audio-script.mjs</code>、公開は <code>publish-audio-briefing.mjs</code>。</p>
<nav><ol>${toc}</ol></nav>
${sections}
</body></html>`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, html, "utf8");
console.log(outFile);

"use client";
import { useRef, useState, useEffect } from "react";
import LikeCommentSection from "./LikeCommentSection";
import type { StructuredContent, ContentSection, SectionKind } from "@/lib/anthropic";

interface Comment {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  isEditorComment?: boolean;
  authorIconKey?: string | null;
  authorIconUrl?: string | null;
}

interface ArticleSwiperProps {
  id: string;
  title: string;
  summary: string | null;
  structuredContent: StructuredContent | null;
  tags: string[];
  source: string;
  publishedAt: string;
  createdAt: string;
  importance: string;
  decisionStatus?: string | null;
  url: string;
  initialRead: boolean;
  initialReadCount: number;
  initialLiked: boolean;
  initialLikeCount: number;
  initialFavorited: boolean;
  initialComments: Comment[];
  isLoggedIn: boolean;
  hideBackLink?: boolean;
}

const SRC: Record<string, { label: string; color: string; bg: string; grad: string; coverBg: string }> = {
  mhlw_latest: { label: "介護保険最新情報", color: "#0D686E", bg: "#E8F5F1", grad: "linear-gradient(150deg,#E8F5F1 0%,#F3FBF9 100%)", coverBg: "/covers/mhlw-bg.jpg" },
  shingi:       { label: "分科会かんたん解説", color: "#B45309", bg: "#FEF3C7", grad: "linear-gradient(150deg,#FEF3C7 0%,#FFFBF0 100%)", coverBg: "/covers/shingi-bg.jpg" },
};
const DEFAULT_SRC = { label: "情報", color: "#374151", bg: "#F3F4F6", grad: "linear-gradient(150deg,#F3F4F6 0%,#FAFAFA 100%)", coverBg: "" };

// ── Illustrations ──────────────────────────────────────────────────────────
function IlluPoints({ color }: { color: string }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="30" fill={color} fillOpacity="0.08"/>
      <path d="M20 22h24M20 32h18M20 42h21" stroke={color} strokeWidth="3" strokeLinecap="round"/>
      <circle cx="46" cy="42" r="8" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5"/>
      <path d="M43 42l2 2 4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IlluSource() {
  return (
    <svg width="110" height="120" viewBox="0 0 110 120" fill="none">
      <rect x="14" y="8" width="66" height="84" rx="9" fill="#FEF3C7" stroke="#F5A623" strokeWidth="1.8"/>
      <rect x="26" y="24" width="42" height="5" rx="2.5" fill="#F5A623" fillOpacity="0.7)"/>
      <rect x="26" y="36" width="32" height="3.5" rx="1.75" fill="#D97706" fillOpacity="0.4"/>
      <rect x="26" y="46" width="38" height="3.5" rx="1.75" fill="#D97706" fillOpacity="0.4"/>
      <rect x="26" y="56" width="28" height="3.5" rx="1.75" fill="#D97706" fillOpacity="0.3"/>
      <rect x="26" y="66" width="34" height="3.5" rx="1.75" fill="#D97706" fillOpacity="0.3"/>
      <circle cx="82" cy="88" r="20" fill="#F5A623"/>
      <path d="M74 88h16M84 80l8 8-8 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ゴリ編集長のふきだしが登場しないセクションは、見出し自体を彼のセリフ風にする
const GORI_HEADING: Partial<Record<SectionKind, string>> = {
  what_changes: "何が変わったか見ていこう",
  background: "なんでこうなったか、解説します",
  what_to_do: "次にやること、教えます",
  schedule: "スケジュールを確認しておきましょう",
  outlook: "この先どうなるか、予想してみます",
};

function LockOverlay({ color }: { color: string }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 5,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
      background: "rgba(255,255,255,0.4)",
    }}>
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      <a href="/base/login" style={{ background: color, color: "#fff", borderRadius: 20, padding: "10px 24px", fontSize: 13, fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 14px rgba(0,0,0,0.2)" }}>
        ログインして続きを読む
      </a>
    </div>
  );
}

const BLUR_STYLE: React.CSSProperties = { filter: "blur(6px)", userSelect: "none", pointerEvents: "none" };

// ── 星評価 ──────────────────────────────────────────────────────────────────
function StarRow({ label, value, light }: { label: string; value: number; light?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: light ? "rgba(255,255,255,0.75)" : "#9BB5B0", width: 34, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", gap: 1 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i < value ? "#F5A623" : light ? "rgba(255,255,255,0.25)" : "#E5E7EB"}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
    </div>
  );
}

// ── Section renderers ──────────────────────────────────────────────────────
// 見出しだけは未ログインでもぼかさず見せる（中身を見たくなる導線として）
function SectionHeading({ section, color, bg }: { section: ContentSection; color: string; bg: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: bg, borderRadius: 16, padding: "8px 14px 8px 8px" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/mascot/gori-base-face.png" alt="" width={38} height={38} style={{ flexShrink: 0, objectFit: "cover", borderRadius: "50%", background: "#fff" }} />
      <h2 style={{ fontSize: 17, fontWeight: 800, color, margin: 0, lineHeight: 1.3 }}>{GORI_HEADING[section.kind] ?? section.heading}</h2>
    </div>
  );
}

function SectionCard({ section, color, bg }: { section: ContentSection; color: string; bg: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {section.kind === "outlook" && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#FEF3C7", border: "1.5px solid #F5D98A", borderRadius: 10, padding: "10px 12px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mascot/gori-alert.png" alt="" width={34} height={34} style={{ flexShrink: 0, objectFit: "contain" }} />
          <p style={{ fontSize: 11.5, color: "#7B4F00", margin: 0, lineHeight: 1.6, paddingTop: 4 }}>
            AIが独自に判断した予想であり、事実に基づいたものではありません。ご注意ください。
          </p>
        </div>
      )}

      {section.type === "text" && section.body && (
        <p style={{ fontSize: 14, color: "#333", lineHeight: 1.85, margin: 0 }}>{section.body}</p>
      )}

      {section.type === "list" && section.items && (
        <ul style={{ margin: 0, paddingLeft: 0, display: "flex", flexDirection: "column", gap: 8, listStyle: "none" }}>
          {section.items.map((item, i) => (
            <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: bg, color, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
              <span style={{ fontSize: 14, color: "#333", lineHeight: 1.7 }}>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {section.type === "table" && section.headers && section.rows && (
        <div style={{ overflowX: "auto", borderRadius: 10, border: `1.5px solid ${color}22` }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead>
              <tr>
                {section.headers.map((h, i) => (
                  <th key={i} style={{ background: bg, color, fontWeight: 700, padding: "10px 12px", textAlign: "left", borderBottom: `2px solid ${color}33`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, ri) => (
                <tr key={ri} style={{ background: ri % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: "9px 12px", color: "#333", borderBottom: "1px solid #F0F0F0", lineHeight: 1.6 }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {section.type === "flow" && section.steps && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {section.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: color, color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                <span style={{ fontSize: 14, color: "#1a1a1a", fontWeight: i === 0 ? 700 : 500, lineHeight: 1.6 }}>{step}</span>
              </div>
              {i < section.steps!.length - 1 && (
                <div style={{ marginLeft: 13, width: 2, height: 20, background: `${color}40` }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ArticleSwiper(props: ArticleSwiperProps) {
  const {
    id, title, structuredContent, summary, tags, source, publishedAt, createdAt, importance, decisionStatus, url,
    initialRead, initialReadCount, initialLiked, initialLikeCount,
    initialFavorited, initialComments, isLoggedIn, hideBackLink,
  } = props;

  const src = SRC[source] ?? DEFAULT_SRC;
  const sections = structuredContent?.sections ?? [];
  const points = structuredContent?.points ?? null;
  const hookTitle = structuredContent?.hookTitle || title;
  const importanceStars = structuredContent?.importanceStars ?? 0;
  const urgencyStars = structuredContent?.urgencyStars ?? 0;
  const isNew = new Date().getTime() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
  // 未ログインは表紙＋3行まとめまでが無料。セクション以降・原文はぼかしてログイン導線を出す。
  const guestLocked = !isLoggedIn;
  void importance;

  // Cards: 表紙(1) + 3行まとめ(1, if points) + sections(N) + 原文(1)
  const TOTAL = 1 + (points ? 1 : 0) + sections.length + 1;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth;
      if (w > 0) setActive(Math.round(el.scrollLeft / w));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  function goTo(i: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * i, behavior: "smooth" });
  }

  const cardBase: React.CSSProperties = {
    flexShrink: 0,
    width: "100%",
    height: 480,
    scrollSnapAlign: "start",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
    padding: "8% 8% 5%",
  };

  let cardIndex = 0;

  return (
    <div>
      {!hideBackLink && (
        <a href="/base" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: src.color, textDecoration: "none", marginBottom: 14 }}>
          ← 一覧に戻る
        </a>
      )}

      {/* Swipe container */}
      <div ref={scrollRef} className="no-scrollbar" style={{ display: "flex", overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "none", msOverflowStyle: "none", borderRadius: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>

        {/* ── Card 1: 表紙 ── */}
        {(() => { const ci = cardIndex++; return (
          <div style={{ ...cardBase, padding: 0, background: "#fff", display: "flex", flexDirection: "column" }}>
            {/* イラスト背景バンド（ゴリ編集長＋資料イラスト） */}
            <div style={{
              position: "relative",
              flexShrink: 0,
              height: 215,
              backgroundImage: src.coverBg ? `url(${src.coverBg})` : undefined,
              backgroundColor: src.bg,
              backgroundSize: "cover",
              backgroundPosition: "center 30%",
              padding: "3% 8% 0",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                  {isNew && (
                    <span style={{ background: "#F5A623", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 4, width: "fit-content" }}>新着</span>
                  )}
                  <span style={{ fontSize: 11, color: src.color, fontWeight: 700, background: "rgba(255,255,255,0.85)", padding: "3px 9px", borderRadius: 4, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>{src.label}</span>
                  {decisionStatus === "discussion" && (
                    <span style={{ fontSize: 10, color: "#B45309", fontWeight: 800, background: "rgba(255,255,255,0.9)", padding: "3px 9px", borderRadius: 4, width: "fit-content" }}>議論中</span>
                  )}
                  {decisionStatus === "decided" && (
                    <span style={{ fontSize: 10, color: "#0D686E", fontWeight: 800, background: "rgba(255,255,255,0.9)", padding: "3px 9px", borderRadius: 4, width: "fit-content" }}>決定事項</span>
                  )}
                </div>
                <div style={{ background: src.color, borderRadius: 10, padding: "8px 12px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", minWidth: 56 }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.8)", fontWeight: 700, marginBottom: 2, letterSpacing: "0.05em" }}>発表日</div>
                  <div style={{ fontSize: 18, color: "#fff", fontWeight: 900, lineHeight: 1.1 }}>
                    {new Date(publishedAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{new Date(publishedAt).getFullYear()}</div>
                </div>
              </div>
            </div>

            {/* テキストゾーン */}
            <div style={{ flex: 1, minHeight: 0, padding: "16px 8% 5%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <h1 style={{ fontSize: hookTitle.length > 26 ? 17 : 20, fontWeight: 900, color: "#1a1a1a", lineHeight: 1.45, margin: "0 0 4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{hookTitle}</h1>
                <p style={{ fontSize: 10.5, color: "#999", margin: "0 0 8px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</p>

                {(importanceStars > 0 || urgencyStars > 0) && (
                  <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
                    {importanceStars > 0 && <StarRow label="重要度" value={importanceStars} />}
                    {urgencyStars > 0 && <StarRow label="緊急度" value={urgencyStars} />}
                  </div>
                )}

                {tags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, overflow: "hidden", whiteSpace: "nowrap" }}>
                    {tags.slice(0, 3).map(tag => (
                      <a key={tag} href={`/base?q=${encodeURIComponent(tag)}`} style={{ fontSize: 10, color: src.color, background: src.bg, border: `1px solid ${src.color}33`, padding: "3px 9px", borderRadius: 12, flexShrink: 0, textDecoration: "none" }}>
                        #{tag}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "#999" }}>全{TOTAL}枚</span>
                <button onClick={() => goTo(ci + 1)} style={{ background: "transparent", border: `1.5px solid ${src.color}`, color: src.color, borderRadius: 20, padding: "7px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {points ? "3行まとめ →" : "中身を読む →"}
                </button>
              </div>
            </div>
          </div>
        );})()}

        {/* ── Card 2: 3行まとめ（pointsがある場合） ── */}
        {points && (() => { const ci = cardIndex++; return (
          <div style={{ ...cardBase, background: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <IlluPoints color={src.color} />
              <div>
                <p style={{ fontSize: 11, color: src.color, fontWeight: 700, margin: "0 0 2px", letterSpacing: "0.05em" }}>3行まとめ</p>
                <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>この記事のポイント</p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, overflowY: "auto" }}>
              {points.map((point, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: i === 0 ? src.bg : "#FAFAFA", borderRadius: 12, padding: "14px 16px", border: i === 0 ? `1.5px solid ${src.color}22` : "1.5px solid #F0F0F0" }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: i === 0 ? src.color : "#E5E7EB", color: i === 0 ? "#fff" : "#666", fontSize: 13, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                  <p style={{ fontSize: i === 0 ? 15 : 14, fontWeight: i === 0 ? 700 : 500, color: "#1a1a1a", lineHeight: 1.7, margin: 0 }}>{point}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => goTo(ci + 1)} style={{ background: "transparent", border: `1.5px solid ${src.color}`, color: src.color, borderRadius: 20, padding: "7px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                詳細を読む →
              </button>
            </div>
          </div>
        );})()}

        {/* ── Cards 3…N: セクション（固定6種） ── */}
        {sections.length > 0 ? sections.map((section, si) => {
          const ci = cardIndex++;
          const isLast = si === sections.length - 1;
          return (
            <div key={si} style={{ ...cardBase, background: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ position: "absolute", top: 12, right: 16, fontSize: 11, color: "#ccc", fontWeight: 600 }}>
                {si + 1}/{sections.length}
              </div>
              {/* 見出しはロックせず表示。中身を見たくなる導線として機能させる */}
              <SectionHeading section={section} color={src.color} bg={src.bg} />
              <div style={{ position: "relative", flex: 1, overflowY: "auto", marginTop: 14 }}>
                <div style={guestLocked ? BLUR_STYLE : undefined}>
                  <SectionCard section={section} color={src.color} bg={src.bg} />
                </div>
                {guestLocked && <LockOverlay color={src.color} />}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, ...(guestLocked ? BLUR_STYLE : {}) }}>
                <button onClick={() => goTo(ci + 1)} style={{ background: "transparent", border: `1.5px solid ${src.color}`, color: src.color, borderRadius: 20, padding: "7px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {isLast ? "原文を見る →" : "次へ →"}
                </button>
              </div>
            </div>
          );
        }) : (
          // structuredContent未生成の場合はsummaryで代替
          (() => { const ci = cardIndex++; return (
            <div style={{ ...cardBase, background: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 4, height: 20, background: src.color, borderRadius: 2 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: src.color }}>概要</span>
              </div>
              <p style={{ fontSize: 15, color: "#333", lineHeight: 1.85, flex: 1, overflowY: "auto" }}>{summary ?? "内容を確認中です"}</p>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <button onClick={() => goTo(ci)} style={{ background: "transparent", border: `1.5px solid ${src.color}`, color: src.color, borderRadius: 20, padding: "7px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  原文を見る →
                </button>
              </div>
            </div>
          );})()
        )}

        {/* ── 最終カード: 原文 ── */}
        <div style={{ ...cardBase, background: "#FFFBF0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 17, fontWeight: 800, color: src.color, margin: "0 0 4px" }}>原文・資料</p>
            <p style={{ fontSize: 12, color: "#aaa", margin: 0 }}>厚生労働省の発信元ページへ</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: 24, ...(guestLocked ? BLUR_STYLE : {}) }}>
            <IlluSource />
            <div style={{ width: "100%" }}>
              <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#F5A623", color: "#fff", borderRadius: 14, padding: "16px", fontSize: 15, fontWeight: 800, textDecoration: "none", boxShadow: "0 4px 14px rgba(245,166,35,0.4)", marginBottom: 12 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                原文を開く
              </a>
              <p style={{ fontSize: 11, color: "#aaa", textAlign: "center", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {url.replace(/^https?:\/\//, "")}
              </p>
            </div>
          </div>
          {guestLocked && <LockOverlay color={src.color} />}
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{ width: i === active ? 22 : 8, height: 8, borderRadius: 4, background: i === active ? src.color : "#C8DDD9", border: "none", padding: 0, cursor: "pointer", transition: "all 0.25s" }} />
        ))}
      </div>

      {/* Action bar + comments */}
      <div style={{ marginTop: 16, position: "relative" }}>
        <div style={guestLocked ? BLUR_STYLE : undefined}>
          <LikeCommentSection
            docId={id}
            article={{
              title,
              hookTitle,
              sourceLabel: src.label,
              sourceColor: src.color,
              sourceBg: src.bg,
              publishedAt,
              importanceStars,
              urgencyStars,
            }}
            initialRead={initialRead} initialReadCount={initialReadCount}
            initialLiked={initialLiked} initialLikeCount={initialLikeCount}
            initialFavorited={initialFavorited}
            initialComments={initialComments}
            isLoggedIn={isLoggedIn}
          />
        </div>
        {guestLocked && <LockOverlay color={src.color} />}
      </div>
    </div>
  );
}

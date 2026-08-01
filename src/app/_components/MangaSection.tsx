"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { P } from "./LandingPage";

interface Persona {
  key: string;
  label: string;
  pages: string[];
}

const PERSONAS: Persona[] = [
  {
    key: "keieisha",
    label: "経営者",
    pages: Array.from({ length: 9 }, (_, i) => `/manga/keieisha/${String(i + 1).padStart(3, "0")}.jpg`),
  },
  { key: "kanrisha", label: "管理者", pages: [] },
  { key: "soudanin", label: "相談員", pages: [] },
  { key: "shinjin-kanrisha", label: "新人管理者", pages: [] },
];

export default function MangaSection() {
  const [selectedKey, setSelectedKey] = useState(PERSONAS[0].key);
  const [pageIndex, setPageIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const selected = PERSONAS.find((p) => p.key === selectedKey)!;

  function selectPersona(key: string) {
    setSelectedKey(key);
    setPageIndex(0);
    scrollerRef.current?.scrollTo({ left: 0, behavior: "instant" as ScrollBehavior });
  }

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(index, selected.pages.length - 1));
    setPageIndex(clamped);
    const el = scrollerRef.current;
    if (el) {
      el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    }
  }

  function handleScroll() {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    setPageIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  return (
    <section style={{ background: P.white, padding: "96px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: P.teal, letterSpacing: "0.2em", marginBottom: 12 }}>MANGA</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, margin: "0 0 16px" }}>マンガで読む、ヨミトク編集部</h2>
          <p style={{ fontSize: 15, color: P.muted, lineHeight: 1.85, margin: 0 }}>
            あなたの立場に近いストーリーを選んでみてください。
          </p>
        </div>

        {/* ペルソナ選択タブ */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
          {PERSONAS.map((p) => {
            const active = p.key === selectedKey;
            const ready = p.pages.length > 0;
            return (
              <button
                key={p.key}
                onClick={() => selectPersona(p.key)}
                style={{
                  position: "relative",
                  padding: "10px 22px",
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  border: `1.5px solid ${active ? P.teal : P.border}`,
                  background: active ? P.teal : P.white,
                  color: active ? P.white : P.muted,
                  transition: "all 0.15s ease",
                }}
              >
                {p.label}
                {!ready && (
                  <span style={{
                    position: "absolute", top: -8, right: -8,
                    fontSize: 9, fontWeight: 800, color: P.muted, background: P.lighter,
                    border: `1px solid ${P.border}`, borderRadius: 999, padding: "2px 6px", whiteSpace: "nowrap",
                  }}>
                    近日公開
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* マンガ表示エリア */}
        {selected.pages.length > 0 ? (
          <div>
            <style>{`
              @media (min-width: 769px) {
                .manga-scroller { height: min(64vh, 740px); width: auto; aspect-ratio: 3 / 4; margin: 0 auto; }
                .manga-frame { flex-basis: 100%; aspect-ratio: auto !important; height: 100%; }
              }
            `}</style>
            <div style={{ position: "relative" }}>
              <div
                ref={scrollerRef}
                onScroll={handleScroll}
                className="no-scrollbar manga-scroller"
                style={{
                  display: "flex",
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                  borderRadius: 20,
                  border: `1px solid ${P.border}`,
                  boxShadow: "0 8px 32px rgba(13,104,110,0.1)",
                }}
              >
                {selected.pages.map((src, i) => (
                  <div key={src} className="manga-frame" style={{ flex: "0 0 100%", scrollSnapAlign: "start", position: "relative", aspectRatio: "3 / 4" }}>
                    <Image src={src} alt={`${selected.label}編 ${i + 1}ページ目`} fill sizes="(max-width: 900px) 100vw, 900px" style={{ objectFit: "cover" }} priority={i === 0} />
                  </div>
                ))}
              </div>

              {pageIndex > 0 && (
                <button
                  onClick={() => goTo(pageIndex - 1)}
                  aria-label="前のページ"
                  style={navBtnStyle("left")}
                >
                  ‹
                </button>
              )}
              {pageIndex < selected.pages.length - 1 && (
                <button
                  onClick={() => goTo(pageIndex + 1)}
                  aria-label="次のページ"
                  style={navBtnStyle("right")}
                >
                  ›
                </button>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 }}>
              {selected.pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`${i + 1}ページ目へ`}
                  style={{
                    width: i === pageIndex ? 20 : 7, height: 7, borderRadius: 999,
                    border: "none", cursor: "pointer",
                    background: i === pageIndex ? P.teal : P.border,
                    transition: "all 0.15s ease",
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            background: P.lighter, borderRadius: 20, border: `1px solid ${P.border}`,
            padding: "56px 24px", textAlign: "center",
          }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: P.muted, margin: 0 }}>
              「{selected.label}」編は準備中です。もうしばらくお待ちください。
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function navBtnStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute",
    top: "50%",
    [side]: 10,
    transform: "translateY(-50%)",
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "none",
    background: "rgba(15,26,25,0.55)",
    color: "#fff",
    fontSize: 24,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

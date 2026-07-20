"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type TagGroup = { label: string; tags: { key: string; label: string }[] };

const PERIODS: { key: string; label: string }[] = [
  { key: "", label: "全期間" },
  { key: "week", label: "今週" },
  { key: "month", label: "今月" },
  { key: "3m", label: "過去3ヶ月" },
];

const SOURCES: { key: string; label: string }[] = [
  { key: "", label: "すべて" },
  { key: "mhlw_latest", label: "介護保険最新情報" },
  { key: "shingi", label: "分科会かんたん解説" },
];

export default function SearchHub({ groups }: { groups: TagGroup[] }) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [tag, setTag] = useState("");
  const [period, setPeriod] = useState("");
  const [source, setSource] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (tag) params.set("tag", tag);
    if (period) params.set("period", period);
    if (source) params.set("cat", source);
    router.push(params.toString() ? `/base?${params.toString()}` : "/base");
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button
          type="submit"
          style={{
            background: "#0D686E", color: "#fff", border: "none", borderRadius: 8,
            padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
        >
          この条件で探す
        </button>
      </div>

      {/* キーワード */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={sectionTitleStyle}>キーワード</h2>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9BB5B0", display: "flex", pointerEvents: "none" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="何をお探しですか？"
            style={{
              width: "100%", height: 44, paddingLeft: 38, paddingRight: 14,
              border: "1.5px solid #D0E8E4", borderRadius: 10, fontSize: 14,
              color: "#1a1a1a", outline: "none", boxSizing: "border-box",
              background: "#F7FAF9", fontFamily: "sans-serif",
            }}
          />
        </div>
      </section>

      {/* 情報源 */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={sectionTitleStyle}>情報源</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {SOURCES.map(s => (
            <ChipButton key={s.key} active={source === s.key} onClick={() => setSource(s.key)}>
              {s.label}
            </ChipButton>
          ))}
        </div>
      </section>

      {/* 発表時期 */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={sectionTitleStyle}>発表時期</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PERIODS.map(p => (
            <ChipButton key={p.key} active={period === p.key} onClick={() => setPeriod(p.key)}>
              {p.label}
            </ChipButton>
          ))}
        </div>
      </section>

      {/* タグ */}
      <section style={{ marginBottom: 28 }}>
        <h2 style={sectionTitleStyle}>タグ</h2>
        {groups.map(group => (
          <div key={group.label} style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: "#888", fontWeight: 700, marginBottom: 8 }}>{group.label}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {group.tags.map(t => (
                <ChipButton
                  key={t.key}
                  active={tag === t.label}
                  onClick={() => setTag(tag === t.label ? "" : t.label)}
                >
                  # {t.label}
                </ChipButton>
              ))}
            </div>
          </div>
        ))}
      </section>

      <button
        type="submit"
        style={{
          display: "block", width: "100%", background: "#0D686E", color: "#fff",
          border: "none", borderRadius: 10, padding: "14px", fontSize: 15, fontWeight: 700,
          cursor: "pointer", position: "sticky", bottom: 16,
          boxShadow: "0 4px 16px rgba(13,104,110,0.3)",
        }}
      >
        この条件で探す
      </button>
    </form>
  );
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 10,
};

function ChipButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontSize: 13,
        color: active ? "#fff" : "#374151",
        background: active ? "#0D686E" : "#fff",
        border: active ? "1.5px solid #0D686E" : "1.5px solid #D5E8E5",
        borderRadius: 20,
        padding: "7px 14px",
        cursor: "pointer",
        fontWeight: active ? 700 : 500,
      }}
    >
      {children}
    </button>
  );
}

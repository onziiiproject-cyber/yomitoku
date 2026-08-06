interface GuestAudioBriefingTeaserProps {
  title: string;
  heroImageUrl: string | null;
  durationSec: number | null;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// 未ログインでは音声は聴けないが、「議事録ラジオがある」こと自体は見せた上でログインへ誘導する。
// 以前はここが丸ごと非表示で、LINEの「視聴する」ボタンで#audio-briefingへ飛んでも
// ジャンプ先が存在せず何も起きないように見えるバグがあった。
export default function GuestAudioBriefingTeaser({ title, heroImageUrl, durationSec }: GuestAudioBriefingTeaserProps) {
  return (
    <article id="audio-briefing" style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #E8F0EE", padding: 0, marginBottom: 16, overflow: "hidden", scrollMarginTop: 16 }}>
      {heroImageUrl && (
        <div style={{ position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImageUrl}
            alt=""
            style={{ width: "100%", aspectRatio: "18 / 13", objectFit: "cover", display: "block", filter: "blur(6px)" }}
          />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.35)" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#1E3C6E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#1E3C6E", color: "#fff", fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 999 }}>
            🎙 議事録ラジオ
          </span>
          {durationSec != null && <span style={{ fontSize: 12, color: "#888" }}>{formatDuration(durationSec)}</span>}
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", margin: "0 0 12px", lineHeight: 1.4 }}>{title}</h3>
        <a href="/base/login" style={{ display: "block", textAlign: "center", background: "#1E3C6E", color: "#fff", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
          ログインして聴く
        </a>
      </div>
    </article>
  );
}

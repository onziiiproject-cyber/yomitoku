interface ArticleAudioBriefingCardProps {
  title: string;
  description: string;
  audioUrl: string;
  durationSec: number;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ArticleAudioBriefingCard({ title, description, audioUrl, durationSec }: ArticleAudioBriefingCardProps) {
  return (
    <article style={{ background: "#F5F0FF", borderRadius: 16, border: "1.5px solid #E4D6FF", padding: "16px 20px", marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#6D28D9", color: "#fff", fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 999 }}>
          🎙 議事録ラジオ解説
        </span>
        <span style={{ fontSize: 12, color: "#888" }}>{formatDuration(durationSec)}</span>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", margin: "0 0 4px", lineHeight: 1.4 }}>{title}</h3>
      <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px", lineHeight: 1.6 }}>{description}</p>

      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio controls src={audioUrl} style={{ width: "100%", height: 36 }} />
    </article>
  );
}

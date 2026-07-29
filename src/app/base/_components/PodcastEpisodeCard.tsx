interface PodcastEpisodeCardProps {
  episodeNo: number;
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

export default function PodcastEpisodeCard({ episodeNo, title, description, audioUrl, durationSec }: PodcastEpisodeCardProps) {
  return (
    <article style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #E8F0EE", padding: "16px 20px", marginBottom: 16 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/podcast/cover.png"
        alt=""
        style={{ width: "100%", aspectRatio: "9 / 4", borderRadius: 16, objectFit: "cover", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", display: "block" }}
      />

      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#0D686E", color: "#fff", fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 999 }}>
            🎙 ヨミトク放送室
          </span>
          <span style={{ fontSize: 12, color: "#888" }}>第{episodeNo}回 ・ {formatDuration(durationSec)}</span>
        </div>

        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", margin: "0 0 4px", lineHeight: 1.4 }}>{title}</h3>
        <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px", lineHeight: 1.6 }}>{description}</p>

        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio controls src={audioUrl} style={{ width: "100%", height: 36 }} />
      </div>
    </article>
  );
}

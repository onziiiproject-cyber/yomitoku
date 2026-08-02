interface ArticleAudioBriefingCardProps {
  title: string;
  description: string;
  audioUrl: string;
  heroImageUrl: string | null;
}

export default function ArticleAudioBriefingCard({ title, description, audioUrl, heroImageUrl }: ArticleAudioBriefingCardProps) {
  return (
    <article style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #E8F0EE", padding: 0, marginTop: 16, overflow: "hidden" }}>
      {heroImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroImageUrl}
          alt=""
          style={{ width: "100%", aspectRatio: "18 / 13", objectFit: "cover", display: "block" }}
        />
      )}

      <div style={{ padding: "16px 20px" }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", margin: "0 0 4px", lineHeight: 1.4 }}>{title}</h3>
        <p style={{ fontSize: 13, color: "#666", margin: "0 0 12px", lineHeight: 1.6 }}>{description}</p>

        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio controls src={audioUrl} style={{ width: "100%", height: 36 }} />
      </div>
    </article>
  );
}

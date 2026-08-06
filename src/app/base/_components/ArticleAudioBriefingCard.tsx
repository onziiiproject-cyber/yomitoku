interface ArticleAudioBriefingCardProps {
  title: string;
  description: string;
  audioUrl: string;
  heroImageUrl: string | null;
  articleId?: string;
}

export default function ArticleAudioBriefingCard({ title, description, audioUrl, heroImageUrl, articleId }: ArticleAudioBriefingCardProps) {
  return (
    // LINEの「視聴する」ボタンはこのidへの#リンクで直接ジャンプさせるため、記事本文を
    // 読み飛ばしてすぐ再生できるようscroll-margin-topも付けている。
    // articleId指定時（タイムライン等、1ページに複数並びうる文脈）はid重複を避けて付けない。
    <article id={articleId ? undefined : "audio-briefing"} style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #E8F0EE", padding: 0, marginBottom: 16, overflow: "hidden", scrollMarginTop: 16 }}>
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

        {articleId && (
          <a href={`/base/articles/${articleId}`} style={{ display: "inline-block", marginTop: 12, fontSize: 13, fontWeight: 700, color: "#1E3C6E", textDecoration: "none" }}>
            元の記事を読む →
          </a>
        )}
      </div>
    </article>
  );
}

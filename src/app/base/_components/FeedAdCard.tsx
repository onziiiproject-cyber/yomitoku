interface FeedAdCardProps {
  id: string;
  imageUrl: string;
}

// タイムラインの記事カードに紛れ込ませる広告（インスタのフィード広告と同じ体裁）。
// クリックは/api/ads/[id]/click経由で計測してから実際のリンク先へ302リダイレクトする。
export default function FeedAdCard({ id, imageUrl }: FeedAdCardProps) {
  return (
    <article style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #E8F0EE", padding: 0, marginBottom: 16, overflow: "hidden" }}>
      <div style={{ padding: "12px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#9BB5B0" }}>広告</span>
      </div>
      <a href={`/api/ads/${id}/click`} target="_blank" rel="noopener noreferrer sponsored" style={{ display: "block" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="広告" style={{ width: "100%", aspectRatio: "18 / 13", objectFit: "cover", display: "block", marginTop: 8 }} />
      </a>
    </article>
  );
}

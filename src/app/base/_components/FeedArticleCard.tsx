import ArticleSwiper from "./ArticleSwiper";
import ExpandableSummary from "./ExpandableSummary";
import ScrollHintArrow from "./ScrollHintArrow";
import type { StructuredContent } from "@/lib/anthropic";
import type { FeedComment } from "@/lib/feedData";

interface FeedArticleCardProps {
  id: string;
  title: string;
  summary: string | null;
  structuredContent: StructuredContent | null;
  tags: string[];
  source: string;
  publishedAt: string;
  createdAt: string;
  importance: string;
  url: string;
  initialRead: boolean;
  initialReadCount: number;
  initialLiked: boolean;
  initialLikeCount: number;
  initialFavorited: boolean;
  initialComments: FeedComment[];
  isLoggedIn: boolean;
  showScrollHint?: boolean;
}

export default function FeedArticleCard(props: FeedArticleCardProps) {
  const {
    id, title, summary, structuredContent, tags, source, publishedAt, createdAt, importance, url,
    initialRead, initialReadCount, initialLiked, initialLikeCount,
    initialFavorited, initialComments, isLoggedIn, showScrollHint,
  } = props;

  return (
    <article style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #E8F0EE", padding: "16px 20px", marginBottom: 16 }}>
      {/* ① スワイプカード ② タグ ③ 読んだ！｜いいね｜コメント｜保存 */}
      <div style={{ position: "relative" }}>
        <ArticleSwiper
          id={id}
          title={title}
          summary={summary}
          structuredContent={structuredContent}
          tags={tags}
          source={source}
          publishedAt={publishedAt}
          createdAt={createdAt}
          importance={importance}
          url={url}
          initialRead={initialRead}
          initialReadCount={initialReadCount}
          initialLiked={initialLiked}
          initialLikeCount={initialLikeCount}
          initialFavorited={initialFavorited}
          initialComments={initialComments}
          isLoggedIn={isLoggedIn}
          hideBackLink
        />
        {showScrollHint && <ScrollHintArrow />}
      </div>

      {/* ⑤ 本文（AI要約）2行＋続きを読む */}
      {summary && (
        <div style={{ marginTop: 12 }}>
          <ExpandableSummary text={summary} isLoggedIn={isLoggedIn} />
        </div>
      )}
    </article>
  );
}

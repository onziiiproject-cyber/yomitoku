const TABS: { key: "mine" | "all"; label: string }[] = [
  { key: "mine", label: "オススメ" },
  { key: "all", label: "すべて" },
];

// 週刊ダイジェスト（/digest/[batchId]）はモード切替ではなく別ページへの導線だが、
// スマホでは右サイドバーごと非表示になり他に入り口が無いため、ここに並べて常設する。
export default function FeedTabs({ active, latestDigestId }: { active: "mine" | "all"; latestDigestId: string | null }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 64,
        zIndex: 50,
        display: "flex",
        gap: 4,
        background: "#F0F4F3",
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.key;
        return (
          <a
            key={tab.key}
            href={`/base${tab.key === "mine" ? "" : "?feed=all"}`}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "10px 12px",
              borderRadius: 9,
              fontSize: 13,
              fontWeight: isActive ? 800 : 600,
              color: isActive ? "#fff" : "#6B8A85",
              background: isActive ? "#0D686E" : "transparent",
              textDecoration: "none",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </a>
        );
      })}
      {latestDigestId && (
        <a
          href={`/digest/${latestDigestId}`}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "10px 12px",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 600,
            color: "#6B8A85",
            background: "transparent",
            textDecoration: "none",
            transition: "all 0.15s",
          }}
        >
          週刊ダイジェスト
        </a>
      )}
    </div>
  );
}

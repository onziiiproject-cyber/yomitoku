const TABS: { key: "mine" | "all"; label: string }[] = [
  { key: "mine", label: "あなたにオススメの投稿一覧" },
  { key: "all", label: "全ての投稿一覧" },
];

export default function FeedTabs({ active }: { active: "mine" | "all" }) {
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
    </div>
  );
}

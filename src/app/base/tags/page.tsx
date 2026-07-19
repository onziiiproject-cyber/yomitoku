import { prisma } from "@/lib/prisma";

const GROUP_LABEL: Record<number, string> = {
  1: "事業種別",
  2: "制度",
  3: "運営",
  4: "経営",
  5: "学び",
  0: "その他",
};
const GROUP_ORDER = [1, 2, 3, 4, 5, 0];

function groupOf(sortOrder: number) {
  return Math.floor(sortOrder / 100);
}

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({ orderBy: { sortOrder: "asc" } });

  const groups = new Map<number, typeof tags>();
  for (const tag of tags) {
    const g = groupOf(tag.sortOrder);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(tag);
  }

  return (
    <div style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1B5E52", marginBottom: 6 }}>タグから探す</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 28 }}>気になるタグをタップして関連記事を探せます</p>

      {GROUP_ORDER.filter((g) => groups.has(g)).map((g) => {
        const groupTags = groups.get(g)!;
        return (
        <section key={g} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 4, height: 16, background: "#0D686E", borderRadius: 2, display: "block" }} />
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>{GROUP_LABEL[g] ?? "その他"}</h2>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {groupTags.map((tag) => (
              <a
                key={tag.id}
                href={`/base?q=${encodeURIComponent(tag.label)}`}
                style={{
                  fontSize: 13,
                  color: "#374151",
                  background: "#fff",
                  border: "1.5px solid #D5E8E5",
                  borderRadius: 20,
                  padding: "6px 14px",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                # {tag.label}
              </a>
            ))}
          </div>
        </section>
        );
      })}

      {tags.length === 0 && (
        <p style={{ fontSize: 13, color: "#aaa" }}>タグがまだ登録されていません</p>
      )}
    </div>
  );
}

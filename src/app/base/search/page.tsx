import { prisma } from "@/lib/prisma";
import SearchHub from "./SearchHub";

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

export default async function SearchPage() {
  const tags = await prisma.tag.findMany({ orderBy: { sortOrder: "asc" } });

  const groupsMap = new Map<number, { key: string; label: string }[]>();
  for (const tag of tags) {
    const g = groupOf(tag.sortOrder);
    if (!groupsMap.has(g)) groupsMap.set(g, []);
    groupsMap.get(g)!.push({ key: tag.key, label: tag.label });
  }
  const groups = GROUP_ORDER
    .filter((g) => groupsMap.has(g))
    .map((g) => ({ label: GROUP_LABEL[g] ?? "その他", tags: groupsMap.get(g)! }));

  return (
    <div style={{ paddingTop: 24, maxWidth: 640 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1B5E52", marginBottom: 6 }}>記事を探す</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>
        キーワード・タグ・発表時期・情報源を組み合わせて絞り込めます
      </p>
      <SearchHub groups={groups} />
    </div>
  );
}

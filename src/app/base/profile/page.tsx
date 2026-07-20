import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ProfileNicknameForm from "./ProfileNicknameForm";
import TagPreferenceEditor from "./TagPreferenceEditor";
import IconPicker from "./IconPicker";

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

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/base/login");

  const [company, readCount, likeCount, commentCount, favoriteCount, allTags, myUserTags] = await Promise.all([
    prisma.company.findUnique({ where: { id: session.companyId }, select: { name: true, contactName: true } }),
    prisma.articleRead.count({ where: { companyId: session.companyId } }),
    prisma.articleLike.count({ where: { companyId: session.companyId } }),
    prisma.articleComment.count({ where: { companyId: session.companyId } }),
    prisma.favorite.count({ where: { companyId: session.companyId } }),
    prisma.tag.findMany({ orderBy: { sortOrder: "asc" } }),
    session.userId
      ? prisma.userTag.findMany({ where: { userId: session.userId }, select: { tag: { select: { key: true } } } })
      : Promise.resolve([]),
  ]);

  if (!company) redirect("/base/login");

  const tagGroupsMap = new Map<number, { key: string; label: string }[]>();
  for (const tag of allTags) {
    const g = groupOf(tag.sortOrder);
    if (!tagGroupsMap.has(g)) tagGroupsMap.set(g, []);
    tagGroupsMap.get(g)!.push({ key: tag.key, label: tag.label });
  }
  const tagGroups = GROUP_ORDER
    .filter((g) => tagGroupsMap.has(g))
    .map((g) => ({ label: GROUP_LABEL[g] ?? "その他", tags: tagGroupsMap.get(g)! }));
  const mySelectedKeys = myUserTags.map((ut) => ut.tag.key);

  const displayName = session.nickname ?? company.contactName;

  const stats = [
    { label: "読んだ記事", value: readCount, color: "#0D686E" },
    { label: "いいね", value: likeCount, color: "#EF4444" },
    { label: "コメント", value: commentCount, color: "#2563EB" },
    { label: "保存した記事", value: favoriteCount, color: "#F59E0B" },
  ];

  return (
    <div style={{ paddingTop: 24, maxWidth: 640 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1B5E52", marginBottom: 24 }}>プロフィール</h1>

      <section style={{ background: "#fff", borderRadius: 14, padding: "24px", border: "1.5px solid #E8F0EE", marginBottom: 20, display: "flex", alignItems: "center", gap: 20 }}>
        <IconPicker
          name={displayName}
          initialIconKey={session.iconKey ?? null}
          initialIconUrl={session.iconUrl ?? null}
          editable={!!session.userId}
        />
        <div>
          <ProfileNicknameForm initialNickname={displayName} editable={!!session.userId} />
          <p style={{ fontSize: 13, color: "#888", margin: "6px 0 0" }}>{company.name}</p>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 12 }}>事業所の利用状況</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #E8F0EE", padding: "16px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#aaa", marginTop: 10 }}>※ 事業所全体（LINE登録メンバー含む）の合計です</p>
      </section>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>興味のあるタグ</h2>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
          選んだタグに関連する記事が、ホームの「あなたにオススメの投稿一覧」に表示されます。LINEのリッチメニューからの設定とも連動します。
        </p>
        {session.userId ? (
          <TagPreferenceEditor groups={tagGroups} initialSelectedKeys={mySelectedKeys} />
        ) : (
          <div style={{ background: "#F0F9F8", border: "1.5px solid #D0E8E4", borderRadius: 10, padding: "16px 18px", fontSize: 13, color: "#1B5E52" }}>
            タグを設定するには、まずプロフィールの登録が必要です。
            <Link href="/base/whoami" style={{ display: "inline-block", marginTop: 10, color: "#0D686E", fontWeight: 700, textDecoration: "underline" }}>
              プロフィールを設定する →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

import { prisma } from "@/lib/prisma";

function formatDateTime(d: Date) {
  return new Date(d).toLocaleString("ja-JP", { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const CATEGORY_COLOR: Record<string, { color: string; bg: string }> = {
  "日付・数値の誤り": { color: "#DC2626", bg: "#FEF2F2" },
  "内容が原文と違う": { color: "#D97706", bg: "#FEF3C7" },
  "誤字脱字": { color: "#2563EB", bg: "#EFF6FF" },
  "わかりにくい": { color: "#7C3AED", bg: "#F5F3FF" },
};
const DEFAULT_CATEGORY_COLOR = { color: "#555", bg: "#F3F4F6" };

export default async function AdminReportsPage() {
  const reports = await prisma.articleReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      company: { select: { name: true, facilityName: true } },
      siteDocument: { select: { id: true, title: true, structuredContent: true } },
    },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1F2E2A", margin: 0 }}>報告一覧</h1>
      <p style={{ fontSize: 13, color: "#888", margin: 0 }}>直近{reports.length}件の、記事内容についての報告です。</p>

      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E8F0EE", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F5F7F6", borderBottom: "1.5px solid #E8F0EE" }}>
              {["日時", "事業所", "記事", "カテゴリ", "詳細"].map((h) => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#555", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "48px", textAlign: "center", color: "#aaa" }}>報告はまだありません</td>
              </tr>
            ) : (
              reports.map((r, i) => {
                const sc = r.siteDocument.structuredContent as { hookTitle?: string } | null;
                const cat = CATEGORY_COLOR[r.category] ?? DEFAULT_CATEGORY_COLOR;
                return (
                  <tr key={r.id} style={{ borderBottom: i < reports.length - 1 ? "1px solid #F0F0F0" : "none", verticalAlign: "top" }}>
                    <td style={{ padding: "14px", color: "#888", whiteSpace: "nowrap" }}>{formatDateTime(r.createdAt)}</td>
                    <td style={{ padding: "14px", color: "#333" }}>{r.company.facilityName ?? r.company.name}</td>
                    <td style={{ padding: "14px", color: "#1a1a1a", maxWidth: 260 }}>
                      <a href={`/base/articles/${r.siteDocument.id}`} target="_blank" rel="noopener noreferrer" style={{ color: "#0D686E", textDecoration: "none" }}>
                        {sc?.hookTitle || r.siteDocument.title}
                      </a>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: cat.color, background: cat.bg, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>
                        {r.category}
                      </span>
                    </td>
                    <td style={{ padding: "14px", color: "#555", maxWidth: 320, whiteSpace: "pre-wrap" }}>{r.body ?? "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

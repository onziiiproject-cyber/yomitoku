import { prisma } from "@/lib/prisma";
import { RegistrationChart, LoginRateChart } from "./AdminCharts";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:          { label: "有効",         color: "#0D686E", bg: "#E6F4F2" },
  PENDING_PAYMENT: { label: "お支払い待ち", color: "#D97706", bg: "#FEF3C7" },
  PAST_DUE:        { label: "支払い延滞",   color: "#DC2626", bg: "#FEF2F2" },
  CANCELED:        { label: "解約済み",     color: "#888",    bg: "#F3F4F6" },
};

function isInTrial(c: { status: string; trialEndsAt: Date | null }) {
  return c.status === "ACTIVE" && !!c.trialEndsAt && new Date(c.trialEndsAt) > new Date();
}

function getDisplayStatus(c: { status: string; trialEndsAt: Date | null; referredByCode?: { isAmbassador: boolean } | null }) {
  if (c.status === "ACTIVE" && c.referredByCode?.isAmbassador) {
    return { label: "アンバサダー", color: "#7C3AED", bg: "#F3E8FF" };
  }
  if (isInTrial(c)) {
    return { label: `無料期間中（〜${formatDate(c.trialEndsAt!)}）`, color: "#7C3AED", bg: "#F3E8FF" };
  }
  return STATUS_LABEL[c.status] ?? { label: c.status, color: "#555", bg: "#eee" };
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" });
}

function buildWeeklyRegistrations(companies: { createdAt: Date }[]) {
  const weeks: Record<string, number> = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    weeks[label] = 0;
  }
  for (const c of companies) {
    const d = new Date(c.createdAt);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 84) continue; // 12週以内のみ
    const weekIndex = Math.floor(diffDays / 7);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekIndex * 7);
    const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    if (label in weeks) weeks[label]++;
  }
  return Object.entries(weeks).map(([label, count]) => ({ label, count }));
}

function buildMonthlyLoginRate(companies: { createdAt: Date; lastLoginAt: Date | null; status: string }[]) {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const label = `${monthStart.getMonth() + 1}月`;
    const activeInMonth = companies.filter(
      (c) => c.status === "ACTIVE" && new Date(c.createdAt) <= monthEnd
    );
    const loggedIn = activeInMonth.filter(
      (c) => c.lastLoginAt && new Date(c.lastLoginAt) >= monthStart && new Date(c.lastLoginAt) <= monthEnd
    );
    const value = activeInMonth.length > 0 ? Math.round((loggedIn.length / activeInMonth.length) * 100) : 0;
    result.push({ label, value });
  }
  return result;
}

export default async function AdminPage() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      tags: { include: { tag: true } },
      lineRecipients: { where: { unfollowedAt: null } },
      referredByCode: { select: { isAmbassador: true } },
    },
  });

  const total    = companies.length;
  const active   = companies.filter((c) => c.status === "ACTIVE" && !isInTrial(c)).length;
  const trialing = companies.filter(isInTrial).length;
  const pending  = companies.filter((c) => c.status === "PENDING_PAYMENT").length;
  const totalLine = companies.reduce((sum, c) => sum + c.lineRecipients.length, 0);

  const registrationData = buildWeeklyRegistrations(companies);
  const loginRateData    = buildMonthlyLoginRate(companies);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* タイトル */}
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1F2E2A", margin: 0 }}>登録企業一覧</h1>

      {/* 統計カード */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
        {[
          { label: "総登録数",        value: total,     color: "#0D686E" },
          { label: "有効（課金中）",  value: active,    color: "#059669" },
          { label: "無料期間中",      value: trialing,  color: "#7C3AED" },
          { label: "お支払い待ち",    value: pending,   color: "#D97706" },
          { label: "LINE登録人数",    value: totalLine, color: "#2563EB" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1.5px solid #E8F0EE" }}>
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 6px" }}>{s.label}</p>
            <p style={{ fontSize: 32, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* グラフ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1.5px solid #E8F0EE" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#1F2E2A", margin: "0 0 4px" }}>登録推移（週別）</p>
          <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 16px" }}>直近12週の新規登録数</p>
          <RegistrationChart data={registrationData} />
        </div>
        <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1.5px solid #E8F0EE" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#1F2E2A", margin: "0 0 4px" }}>月別ログイン率</p>
          <p style={{ fontSize: 12, color: "#aaa", margin: "0 0 16px" }}>有効会員のうちその月にログインした割合</p>
          <LoginRateChart data={loginRateData} />
        </div>
      </div>

      {/* テーブル */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #E8F0EE", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F5F7F6", borderBottom: "1.5px solid #E8F0EE" }}>
              {["法人名", "事業所名", "担当者", "役職", "都道府県", "メール", "タグ", "LINE人数", "ステータス", "登録日"].map((h) => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#555", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: "48px", textAlign: "center", color: "#aaa" }}>登録企業がありません</td>
              </tr>
            ) : (
              companies.map((c, i) => {
                const st = getDisplayStatus(c);
                return (
                  <tr key={c.id} style={{ borderBottom: i < companies.length - 1 ? "1px solid #F0F0F0" : "none" }}>
                    <td style={{ padding: "14px", fontWeight: 600, color: "#1a1a1a" }}>{c.name}</td>
                    <td style={{ padding: "14px", color: "#333" }}>{c.facilityName ?? "—"}</td>
                    <td style={{ padding: "14px", color: "#333" }}>{c.contactName}</td>
                    <td style={{ padding: "14px", color: "#555" }}>{c.contactRole ?? "—"}</td>
                    <td style={{ padding: "14px", color: "#555" }}>{c.prefecture ?? "—"}</td>
                    <td style={{ padding: "14px", color: "#555" }}>
                      <a href={`mailto:${c.email}`} style={{ color: "#0D686E", textDecoration: "none" }}>{c.email}</a>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {c.tags.slice(0, 3).map((ct) => (
                          <span key={ct.tagId} style={{ fontSize: 11, background: "#E6F4F2", color: "#0D686E", padding: "2px 7px", borderRadius: 6 }}>
                            {ct.tag.label}
                          </span>
                        ))}
                        {c.tags.length > 3 && (
                          <span style={{ fontSize: 11, color: "#aaa" }}>+{c.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "14px", textAlign: "center", color: "#333" }}>
                      {c.lineRecipients.length} / {c.maxRecipients}
                    </td>
                    <td style={{ padding: "14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: "3px 10px", borderRadius: 20 }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px", color: "#888", whiteSpace: "nowrap" }}>{formatDate(c.createdAt)}</td>
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

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PortalButton from "./PortalButton";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/base/login");

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    include: {
      lineRecipients: {
        where: { unfollowedAt: null },
        orderBy: { followedAt: "asc" },
      },
    },
  });
  if (!company) redirect("/base/login");

  const recipientCount = company.lineRecipients.length;
  const maxRecipients = company.maxRecipients;

  return (
    <div style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1B5E52", marginBottom: 24 }}>設定</h1>

      {/* Company info */}
      <section style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1.5px solid #E8F0EE", marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1B5E52", marginBottom: 16 }}>事業所情報</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Row label="事業所名" value={company.name} />
          <Row label="担当者名" value={company.contactName} />
          <Row label="メールアドレス" value={company.email} />
          <Row label="プランステータス" value={{ ACTIVE: "有効", PENDING_PAYMENT: "お支払い待ち", PAST_DUE: "支払い延滞", CANCELED: "解約済み" }[company.status] ?? company.status} />
        </div>
        {company.stripeCustomerId && <PortalButton />}
      </section>

      {/* Invite code */}
      <section style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1.5px solid #E8F0EE", marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1B5E52", marginBottom: 8 }}>会社コード</h2>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 16, lineHeight: 1.6 }}>
          LINEで通知を受け取るメンバーを追加するには、下記の会社コードをLINEのチャットで送信してもらってください。
          （最大{maxRecipients}名まで）
        </p>

        {company.inviteCode ? (
          <div style={{ background: "#F7FAF9", border: "2px dashed #1B7A6D", borderRadius: 12, padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: "#6B9E96", marginBottom: 8 }}>会社コード</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#1B5E52", letterSpacing: "0.2em", fontFamily: "monospace" }}>
              {company.inviteCode}
            </div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>
              LINEで「{company.inviteCode}」と送信すると登録されます
            </div>
          </div>
        ) : (
          <div style={{ background: "#FEF9EC", border: "1px solid #F5A623", borderRadius: 10, padding: "16px", fontSize: 13, color: "#7B4F00" }}>
            会社コードはお支払い完了後に発行されます
          </div>
        )}
      </section>

      {/* LINE Recipients */}
      <section style={{ background: "#fff", borderRadius: 14, padding: "20px", border: "1.5px solid #E8F0EE" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1B5E52", margin: 0 }}>LINE登録メンバー</h2>
          <span style={{ fontSize: 13, color: "#888" }}>{recipientCount} / {maxRecipients}名</span>
        </div>

        {company.lineRecipients.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#aaa", fontSize: 14 }}>
            まだメンバーが登録されていません
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {company.lineRecipients.map((r, i) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#F7FAF9", borderRadius: 8 }}>
                <div style={{ width: 32, height: 32, background: "#1B5E52", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{i + 1}</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{r.displayName ?? "名前なし"}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>
                    {new Date(r.followedAt).toLocaleDateString("ja-JP")} 登録
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
      <span style={{ fontSize: 12, color: "#888", minWidth: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 14, color: "#1a1a1a", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

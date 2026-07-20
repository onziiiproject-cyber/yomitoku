import { prisma } from "@/lib/prisma";
import ReferralCodeManager from "./ReferralCodeManager";

export default async function AdminReferralsPage() {
  const codes = await prisma.referralCode.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      referredCompanies: { select: { status: true } },
    },
  });

  const totalSignups = codes.reduce((sum, c) => sum + c.referredCompanies.length, 0);
  const totalConversions = codes.reduce(
    (sum, c) => sum + c.referredCompanies.filter((r) => r.status === "ACTIVE").length,
    0
  );

  const rows = codes.map((c) => ({
    id: c.id,
    code: c.code,
    label: c.label,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    isAmbassador: c.isAmbassador,
    createdAt: c.createdAt.toISOString(),
    signupCount: c.referredCompanies.length,
    conversionCount: c.referredCompanies.filter((r) => r.status === "ACTIVE").length,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1F2E2A", margin: 0 }}>紹介実績</h1>
      <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
        発行済みコード{codes.length}件／紹介経由の登録{totalSignups}件（うち有効{totalConversions}件）
      </p>
      <ReferralCodeManager initialCodes={rows} />
    </div>
  );
}

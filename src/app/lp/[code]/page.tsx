import type { Metadata } from "next";
import LandingPage from "../../_components/LandingPage";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// 紹介コードをそのまま登録リンクに引き継ぐキャンペーンLP。
// トップページと同じ内容で、CTAだけ /register?ref=コード に向ける。
export default async function CampaignLandingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  // アクセス数の記録（成約に至らなかった訪問も含めて計測するため）。
  // 表示をブロックしないようfire-and-forgetにし、存在しないコードは静かに無視する。
  prisma.referralCode.updateMany({ where: { code }, data: { visitCount: { increment: 1 } } }).catch(() => {});
  return <LandingPage ctaHref={`/register?ref=${encodeURIComponent(code)}`} />;
}

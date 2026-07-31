import type { Metadata } from "next";
import LandingPage from "../../_components/LandingPage";

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
  return <LandingPage ctaHref={`/register?ref=${encodeURIComponent(code)}`} />;
}

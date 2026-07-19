import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "500", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://yomitoku-base.com";
const SITE_TITLE = "ヨミトク編集部 | 制度を、読むから、わかるへ。";
const SITE_DESCRIPTION =
  "介護施設・事業所向け。厚生労働省などの介護保険最新情報をゴリ編集長が整理し、毎週水曜日『週刊ヨミトク』としてLINEでお届け。バックナンバーは編集室でいつでも検索。月額300円から。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "ヨミトク編集部",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={notoSansJP.className}>
      <body>{children}</body>
    </html>
  );
}

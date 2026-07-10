import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "YOMITOKU（ヨミトク）| 介護保険情報をLINEでお届け",
  description:
    "介護施設・事業所向け。厚生労働省などの介護保険最新情報をAIが要約し、毎日LINEに配信。月額300円から。",
  openGraph: {
    title: "YOMITOKU（ヨミトク）| 介護保険情報をLINEでお届け",
    description:
      "介護施設・事業所向け。厚生労働省などの介護保険最新情報をAIが要約し、毎日LINEに配信。月額300円から。",
    locale: "ja_JP",
    type: "website",
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

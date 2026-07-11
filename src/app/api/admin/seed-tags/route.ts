import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TAGS: Array<{ key: string; label: string; sortOrder: number }> = [
  // 事業種別
  { key: "訪問介護", label: "訪問介護", sortOrder: 101 },
  { key: "訪問看護", label: "訪問看護", sortOrder: 102 },
  { key: "通所介護", label: "通所介護（デイサービス）", sortOrder: 103 },
  { key: "通所リハビリ", label: "通所リハビリ", sortOrder: 104 },
  { key: "居宅介護支援", label: "居宅介護支援", sortOrder: 105 },
  { key: "福祉用具", label: "福祉用具", sortOrder: 106 },
  { key: "訪問入浴", label: "訪問入浴", sortOrder: 107 },
  { key: "短期入所", label: "短期入所（ショート）", sortOrder: 108 },
  { key: "小規模多機能", label: "小規模多機能", sortOrder: 109 },
  { key: "看護小規模多機能", label: "看護小規模多機能", sortOrder: 110 },
  { key: "認知症グループホーム", label: "認知症グループホーム", sortOrder: 111 },
  { key: "特養", label: "特養", sortOrder: 112 },
  { key: "老健", label: "老健", sortOrder: 113 },
  { key: "介護医療院", label: "介護医療院", sortOrder: 114 },
  { key: "有料老人ホーム", label: "有料老人ホーム", sortOrder: 115 },
  { key: "サ高住", label: "サ高住", sortOrder: 116 },
  { key: "その他", label: "その他", sortOrder: 117 },
  // 制度
  { key: "制度改正", label: "制度改正", sortOrder: 201 },
  { key: "報酬改定", label: "報酬改定", sortOrder: 202 },
  { key: "Q&A", label: "Q&A", sortOrder: 203 },
  { key: "通知", label: "通知", sortOrder: 204 },
  // 運営
  { key: "人員基準", label: "人員基準", sortOrder: 301 },
  { key: "加算・減算", label: "加算・減算", sortOrder: 302 },
  { key: "運営指導", label: "運営指導", sortOrder: 303 },
  { key: "BCP", label: "BCP", sortOrder: 304 },
  { key: "感染対策", label: "感染対策", sortOrder: 305 },
  { key: "安全対策", label: "安全対策", sortOrder: 306 },
  // 経営
  { key: "補助金・助成金", label: "補助金・助成金", sortOrder: 401 },
  { key: "公募", label: "公募", sortOrder: 402 },
  { key: "ICT・DX", label: "ICT・DX", sortOrder: 403 },
  { key: "生産性向上", label: "生産性向上", sortOrder: 404 },
  { key: "人材採用", label: "人材採用", sortOrder: 405 },
  { key: "処遇改善", label: "処遇改善", sortOrder: 406 },
  // 学び
  { key: "セミナー", label: "セミナー", sortOrder: 501 },
  { key: "ガイドライン", label: "ガイドライン", sortOrder: 502 },
  { key: "事例紹介", label: "事例紹介", sortOrder: 503 },
];

export async function POST(req: NextRequest) {
  const auth = req.headers.get("x-admin-secret");
  if (auth !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let created = 0;
  let skipped = 0;

  for (const tag of TAGS) {
    const existing = await prisma.tag.findUnique({ where: { key: tag.key } });
    if (existing) {
      skipped++;
    } else {
      await prisma.tag.create({ data: tag });
      created++;
    }
  }

  const all = await prisma.tag.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ ok: true, created, skipped, total: all.length });
}

import { NextRequest, NextResponse } from "next/server";
import { generateShingiCoverPDF, generateShingiTopicPDF, type ShingiPDFData } from "@/lib/pdf-shingi";

const SAMPLE: ShingiPDFData = {
  meta: {
    council_name: "社会保障審議会 介護給付費分科会",
    session_no: 257,
    date: "2026年5月25日",
    feature_label: "地域密着型サービス特集・全3テーマ",
  },
  themes: [
    { no: 1, name: "小規模多機能型居宅介護", short_desc: "通い・訪問・泊まりを組み合わせ、在宅生活を支えるサービス", icon: "house", color: "teal" },
    { no: 2, name: "看護小規模多機能型居宅介護", short_desc: "医療ニーズの高い方を支える、看護と介護の連携サービス", icon: "nurse", color: "darkteal" },
    { no: 3, name: "認知症グループホーム", short_desc: "認知症の方が少人数で暮らす、家庭的な共同生活の場", icon: "group", color: "olive" },
  ],
  summary: {
    lead: "今回は「地域密着型サービス」に関する3つのテーマが議論されました。",
    body: "いずれも令和6年度改定での加算見直しが中心テーマですが、共通して「人材確保の難しさ」と「地域による整備の偏り」が課題として指摘されています。",
    keywords: [
      { label: "人材確保の難しさ", desc: "看護職員・夜勤職員の不足が深刻化", icon: "person" },
      { label: "地域による整備の偏り", desc: "サービスの地域格差が大きな課題に", icon: "pin" },
    ],
  },
  theme_details: [
    {
      no: 1,
      category: "地域密着型サービス",
      name: "小規模多機能型居宅介護",
      overview: "「通い」を中心に、利用者の状態に応じて「訪問」や「泊まり」を柔軟に組み合わせて利用できるサービスです。平成18年（2006年）に創設され、中重度になっても住み慣れた自宅での生活を続けられるよう支援することを目的としています。要介護1・2の利用者が中心ですが、要介護3〜5の中重度者も約94%が利用対象とされており、退院直後の不安定な時期を支える役割としても期待されています。",
      stats: [
        { value: "95.3%", label: "要介護1・2の利用者割合" },
        { value: "21〜25人", label: "1事業所あたりの実登録者数" },
        { value: "78.5%", label: "人材確保が困難と回答した割合" },
      ],
      ai_comment: "退院直後の支援や中重度者の在宅継続を支える「地域の要」。人材確保と経営の安定が、今後ますます重要になりそうです。",
      revision_points: [
        { title: "総合マネジメント体制強化加算を新設・再編", desc: "地域との連携強化を評価する新区分（1,200単位／月）を設置し、既存区分は800単位／月に", ref: "P.24、25" },
        { title: "認知症対応力を強化", desc: "専門研修修了者の配置を新たに評価する加算を新設（920単位・890単位など4段階）", ref: "P.26" },
        { title: "管理者の配置基準を緩和", desc: "提供するサービスの種類を問わず、他事業所との兼務が可能に", ref: "P.27" },
        { title: "利用実態を踏まえた柔軟な評価", desc: "通い・宿泊・訪問の柔軟な組み合わせ方を評価する視点が導入", ref: "P.30" },
        { title: "在宅生活の継続支援を後押し", desc: "中重度化・医療ニーズの高まりに対応し、在宅生活の継続を支える体制を強化", ref: "" },
      ],
      issues: [
        { desc: "人材確保が困難と回答した事業所が", value: "78.5%", note: "と最多", ref: "P.36" },
        { desc: "経営・収支面の課題を挙げる事業所が", value: "60.7%", note: "", ref: "P.36" },
        { desc: "利用者確保の課題（56.3%）や、軽度者から「包括報酬が割高」との声も", value: "", note: "", ref: "P.34, 36" },
        { desc: "中山間地域では、廃止の可能性がある事業所が", value: "10.7%", note: "存在", ref: "P.37" },
      ],
      opinions: [
        { title: "退院直後、不安定な状態を支える有効なサービス", desc: "医療機関からの退院直後、不安定な状態を支える有効なサービスとして評価する声", ref: "P.39" },
        { title: "市町村内にとどまらない連携の必要性", desc: "市町村内の整備だけでなく、隣接自治体間の連携が必要との指摘", ref: "P.40" },
        { title: "中山間地域での包括的な機能の重要性", desc: "中山間地域では複数機能を包括的に提供する重要性を指摘", ref: "P.40" },
        { title: "認知度向上と普及促進がカギ", desc: "地域包括ケアシステムの担い手として、認知度向上と普及促進が重要", ref: "P.41" },
      ],
      impact_stars: 4,
      related_roles: ["デイサービス", "小多機", "地域包括支援センター"],
      source_label: "資料1（小規模多機能型居宅介護・PDF）",
      source_url: "https://www.mhlw.go.jp/stf/shingi/shingi-hosho_126698.html",
    },
    {
      no: 2,
      category: "地域密着型サービス",
      name: "看護小規模多機能型居宅介護",
      overview: "通い・訪問・泊まりに加え、訪問看護を一体的に提供する複合型サービスです。医療ニーズの高い要介護者が在宅生活を継続できるよう、看護と介護が連携して支援します。特に退院直後の在宅移行支援や、がん末期・神経難病などの利用者への対応に強みを持ちます。",
      stats: [
        { value: "約5,800", label: "全国の事業所数（令和5年）" },
        { value: "92%", label: "医療ニーズが高い利用者の割合" },
      ],
      ai_comment: "医療と介護の連携を一手に担うサービス。看護師確保が最大の課題であり、地域の医療機関との連携強化が経営の鍵となります。",
      revision_points: [
        { title: "特定施設との連携加算の新設", desc: "病院・診療所との連携を評価する加算が新たに設けられました", ref: "P.15" },
        { title: "看護師配置の柔軟化", desc: "准看護師の活用範囲が拡大され、人材確保の幅が広がりました", ref: "P.16" },
      ],
      issues: [
        { desc: "看護職員の確保が困難と回答した事業所が", value: "82%", note: "と最多", ref: "P.45" },
        { desc: "夜間対応への負担が増加しており、持続可能な運営が課題", value: "", note: "", ref: "P.47" },
      ],
      opinions: [
        { title: "在宅看取りの担い手として期待", desc: "人生の最終段階における在宅看取りの支援拠点として評価する声が多い", ref: "P.50" },
        { title: "小規模事業所への財政支援が必要", desc: "規模が小さいため固定費の負担が重く、何らかの支援策が必要との意見", ref: "P.52" },
      ],
      impact_stars: 4,
      related_roles: ["看護小規模多機能", "訪問看護", "居宅介護支援"],
      source_label: "資料2（看護小規模多機能型居宅介護・PDF）",
      source_url: "https://www.mhlw.go.jp/stf/shingi/shingi-hosho_126698.html",
    },
    {
      no: 3,
      category: "地域密着型サービス",
      name: "認知症グループホーム",
      overview: "認知症の方が少人数（5〜9人）で共同生活を営みながら、日常生活上の支援や機能訓練を受けるサービスです。家庭的な環境の中で、認知症の進行を緩やかにしながら自立した生活を送ることを目的としています。地域との交流を重視した運営が特徴で、地域包括ケアシステムの重要な構成要素となっています。",
      stats: [
        { value: "約14,000", label: "全国の事業所数" },
        { value: "平均78歳", label: "利用者の平均年齢" },
      ],
      ai_comment: "認知症ケアの中核を担うサービス。BPSD対応の専門性向上と、地域との連携強化が今後の差別化ポイントになります。",
      revision_points: [
        { title: "認知症専門ケア加算の拡充", desc: "認知症介護実践リーダー研修修了者の配置評価が強化されました", ref: "P.8" },
        { title: "医療連携体制加算の見直し", desc: "医師・看護師との連携体制に応じた段階的な評価に見直されました", ref: "P.10" },
        { title: "夜勤職員配置加算の創設", desc: "夜間の手厚い見守り体制を評価する新加算が設けられました", ref: "P.12" },
      ],
      issues: [
        { desc: "夜勤・宿直に対応できる人材の確保が困難", value: "", note: "", ref: "P.58" },
        { desc: "BPSD（行動・心理症状）への対応に課題があると回答した事業所が", value: "67%", note: "", ref: "P.60" },
        { desc: "医療ニーズの高い利用者の受け入れが困難なケースが増加", value: "", note: "", ref: "P.62" },
      ],
      opinions: [
        { title: "BPSDへの専門的対応力の向上が必要", desc: "認知症の行動・心理症状への専門的対応ができる人材育成が急務との意見", ref: "P.65" },
        { title: "地域交流活動への支援を求める声", desc: "地域との交流活動が認知症の進行緩和に効果的であり、費用面の支援が必要", ref: "P.67" },
      ],
      impact_stars: 3,
      related_roles: ["認知症グループホーム", "通所介護", "居宅介護支援"],
      source_label: "資料3（認知症グループホーム・PDF）",
      source_url: "https://www.mhlw.go.jp/stf/shingi/shingi-hosho_126698.html",
    },
  ],
};

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== "Bearer yomitoku-admin-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "cover";
  const themeNo = parseInt(url.searchParams.get("theme") ?? "1", 10);

  try {
    let pdfBuffer: Buffer;
    let filename: string;

    if (type === "topic") {
      pdfBuffer = await generateShingiTopicPDF(SAMPLE, themeNo);
      filename = `shingi-topic-${themeNo}.pdf`;
    } else {
      pdfBuffer = await generateShingiCoverPDF(SAMPLE);
      filename = "shingi-cover.pdf";
    }

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

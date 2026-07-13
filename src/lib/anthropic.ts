import Anthropic from "@anthropic-ai/sdk";
import type { ShingiPDFData } from "./pdf-shingi";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  return _client;
}

export const TAGS_BY_CATEGORY = {
  事業種別: [
    "訪問介護", "訪問看護", "通所介護", "通所リハビリ",
    "居宅介護支援", "福祉用具", "訪問入浴", "短期入所",
    "小規模多機能", "看護小規模多機能", "認知症グループホーム",
    "特養", "老健", "介護医療院", "有料老人ホーム", "サ高住", "その他",
  ],
  制度: ["制度改正", "報酬改定", "Q&A", "通知"],
  運営: ["人員基準", "加算・減算", "運営指導", "BCP", "感染対策", "安全対策"],
  経営: ["補助金・助成金", "公募", "ICT・DX", "生産性向上", "人材採用", "処遇改善"],
  学び: ["セミナー", "ガイドライン", "事例紹介"],
};

export const AVAILABLE_TAGS = Object.values(TAGS_BY_CATEGORY).flat();

export interface AnalysisResult {
  summary: string;
  tags: string[];
  importance: "high" | "normal";
}

export async function analyzeDocument(
  title: string,
  content: string
): Promise<AnalysisResult> {
  const client = getClient();
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `あなたは介護保険専門の情報アナリストです。以下の文書を分析してください。

タイトル: ${title}
内容: ${content.slice(0, 4000)}

以下のJSON形式のみで回答してください（他のテキスト不要）：
{
  "summary": "介護事業者向けに100〜150字で要点を伝える要約",
  "tags": ["関連するタグをすべて選ぶ（関連性の高いものはすべて含める）"],
  "importance": "high または normal"
}

利用可能なタグ（この中から選ぶ）:
${AVAILABLE_TAGS.join(", ")}

importanceをhighにする条件: 法令改正・報酬改定・緊急通知・分科会の重要決定事項`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "{}";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI response parse failed");

  const parsed = JSON.parse(match[0]);
  return {
    summary: parsed.summary ?? "",
    tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t: string) => AVAILABLE_TAGS.includes(t)) : [],
    importance: parsed.importance === "high" ? "high" : "normal",
  };
}

export async function buildWeeklyDigest(
  docs: Array<{ title: string; summary: string; importance: string }>
): Promise<string> {
  if (docs.length === 0) return "";

  const client = getClient();
  const docList = docs
    .map((d, i) => `${i + 1}. 【${d.importance === "high" ? "重要" : "通常"}】${d.title}\n   ${d.summary}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `介護事業所の管理者向けに、今週の介護保険関連情報を150字以内でまとめてください。

今週の情報:
${docList}

・「今週は〜」で始める
・重要な情報を先に触れる
・箇条書きなし、自然な文章で
・事業所運営に直結する点を強調`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

export async function buildPDFAIComment(
  docs: Array<{ title: string; summary: string; tags: string[]; importance: string }>
): Promise<string> {
  if (docs.length === 0) return "今週は新しい通知はありませんでした。";

  const client = getClient();
  const docList = docs
    .map((d, i) => `${i + 1}. 【${d.importance === "high" ? "重要" : "通常"}】${d.title}\n   ${d.summary}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `介護事業所の経営者・管理者に向けて、今週の通知全体を踏まえた実務アドバイスを200字以内で書いてください。

今週の通知一覧:
${docList}

ルール:
・「今週は」で始める
・今週特に注意すべき点を1〜2つ挙げる
・具体的な行動につながる言葉で締める
・箇条書き不使用、自然な文体で
・経営判断に直結する視点を重視する`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

export async function buildShingiPDFData(
  title: string,
  rawText: string,
  sessionUrl: string
): Promise<ShingiPDFData> {
  const client = getClient();

  // 特殊文字・HTMLエンティティをクリーニング
  const cleanText = rawText
    .replace(/&#\d+;/g, " ")
    .replace(/&[a-zA-Z]+;/g, " ")
    .replace(/[""'']/g, '"')
    .replace(/\s{2,}/g, " ")
    .trim();

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `あなたは介護保険の専門家です。以下の社会保障審議会 介護給付費分科会の会議ページのテキストから、スライド生成用の構造化データを作成してください。

タイトル: ${title}
テキスト:
${cleanText.slice(0, 8000)}

以下のJSONフォーマットのみで回答してください（他のテキスト不要）:
{
  "meta": {
    "council_name": "社会保障審議会 介護給付費分科会",
    "session_no": 会議回数（数値）,
    "date": "○年○月○日",
    "feature_label": "○○特集・全Nテーマ"
  },
  "themes": [
    { "no": 1, "name": "テーマ名", "short_desc": "1〜2行説明", "icon": "house|nurse|group|clipboard|heart|brain|chart|person", "color": "teal|darkteal|olive" }
  ],
  "summary": {
    "lead": "今回は「○○」に関するNつのテーマが議論されました。",
    "body": "共通の背景・課題についての説明",
    "keywords": [
      { "label": "キーワード1", "desc": "説明", "icon": "person|pin|chart|warning" },
      { "label": "キーワード2", "desc": "説明", "icon": "person|pin|chart|warning" }
    ]
  },
  "theme_details": [
    {
      "no": 1,
      "category": "カテゴリ",
      "name": "テーマ名",
      "overview": "サービス概要200〜300字",
      "stats": [],
      "ai_comment": "経営者向けAIコメント60〜80字",
      "revision_points": [{ "title": "ポイント名", "desc": "説明", "ref": "" }],
      "issues": [{ "desc": "課題説明", "value": "", "note": "", "ref": "" }],
      "opinions": [{ "title": "意見タイトル", "desc": "説明", "ref": "" }],
      "impact_stars": 3,
      "related_roles": ["事業種別"],
      "source_label": "資料名",
      "source_url": "${sessionUrl}"
    }
  ]
}

ルール：テキストから読み取れる情報のみ記載。数値・統計は推測不可。colorはteal/darkteal/oliveを順番に割り当て。iconはテーマ内容から選択。`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Shingi PDF data parse failed: no JSON found");
  try {
    return JSON.parse(match[0]) as ShingiPDFData;
  } catch (e) {
    // JSONが壊れている場合、コードブロック内を探す
    const block = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (block) return JSON.parse(block[1].trim()) as ShingiPDFData;
    throw new Error(`Shingi PDF data parse failed: ${e}`);
  }
}

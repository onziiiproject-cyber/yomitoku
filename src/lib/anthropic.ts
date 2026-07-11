import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  return _client;
}

export const AVAILABLE_TAGS = [
  "制度改正・通知",
  "報酬改定",
  "運営・管理",
  "人材・採用",
  "IT・DX",
  "経営・財務",
  "補助金・助成金",
  "イベント・研修",
  "訪問介護",
  "通所介護",
  "訪問看護",
  "居宅介護支援",
  "グループホーム",
  "有料老人ホーム",
  "施設サービス",
];

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
内容: ${content.slice(0, 2000)}

以下のJSON形式のみで回答してください（他のテキスト不要）：
{
  "summary": "介護事業者向けに100〜150字で要点を伝える要約",
  "tags": ["利用可能なタグから最大3つ"],
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
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    importance: parsed.importance === "high" ? "high" : "normal",
  };
}

export async function buildWeeklyDigest(
  docs: Array<{ title: string; summary: string; url: string; importance: string }>
): Promise<string> {
  if (docs.length === 0) return "";

  const client = getClient();
  const docList = docs
    .map((d, i) => `${i + 1}. 【${d.importance === "high" ? "重要" : "通常"}】${d.title}\n   ${d.summary}`)
    .join("\n\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `介護事業所の管理者向けに、今週の介護保険関連情報をまとめてください。

今週の情報:
${docList}

以下のフォーマットで200字以内でまとめてください：
・重要な情報を先に
・箇条書きなし、自然な文章で
・「今週は〜」で始める
・事業所運営に直結する点を強調`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

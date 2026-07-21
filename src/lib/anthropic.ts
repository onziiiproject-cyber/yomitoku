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
  decisionStatus: "discussion" | "decided" | null;
}

export async function analyzeDocument(
  title: string,
  content: string,
  pdfBase64?: string
): Promise<AnalysisResult> {
  const client = getClient();

  const prompt = `あなたは介護保険専門の情報アナリストです。以下の文書を分析してください。

タイトル: ${title}
${pdfBase64 ? "" : `内容: ${content.slice(0, 4000)}`}

以下のJSON形式のみで回答してください（他のテキスト不要）：
{
  "summary": "介護事業者向けに100〜150字で要点を伝える要約",
  "tags": ["関連するタグをすべて選ぶ（関連性の高いものはすべて含める）"],
  "importance": "high または normal",
  "decisionStatus": "discussion, decided, または null"
}

利用可能なタグ（この中から選ぶ）:
${AVAILABLE_TAGS.join(", ")}

importanceをhighにする条件: 法令改正・報酬改定・緊急通知・分科会の重要決定事項

decisionStatusの判定基準:
- "discussion": 審議会・分科会での検討中の議題、意見募集（パブリックコメント）、まだ確定していない案・方針
- "decided": 法令改正の施行決定、報酬改定の確定内容、通知として正式発出された内容
- どちらとも言えない場合（統計・事例紹介・Q&Aなど）はnull`;

  const messageContent = pdfBase64
    ? [
        { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: pdfBase64 } },
        { type: "text" as const, text: prompt },
      ]
    : prompt;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    messages: [{ role: "user", content: messageContent }],
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
    decisionStatus:
      parsed.decisionStatus === "discussion" || parsed.decisionStatus === "decided"
        ? parsed.decisionStatus
        : null,
  };
}

// 既存記事へのバックフィル用。analyzeDocumentをフルで再実行せず、
// decisionStatusの再分類だけを軽量に行う。
export async function classifyDecisionStatus(
  title: string,
  content: string
): Promise<"discussion" | "decided" | null> {
  const client = getClient();

  const prompt = `あなたは介護保険専門の情報アナリストです。以下の文書が「議論中」か「決定事項」かを分類してください。

タイトル: ${title}
内容: ${content.slice(0, 3000)}

以下のJSON形式のみで回答してください（他のテキスト不要）：
{ "decisionStatus": "discussion, decided, または null" }

判定基準:
- "discussion": 審議会・分科会での検討中の議題、意見募集（パブリックコメント）、まだ確定していない案・方針
- "decided": 法令改正の施行決定、報酬改定の確定内容、通知として正式発出された内容
- どちらとも言えない場合（統計・事例紹介・Q&Aなど）はnull`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 64,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  const parsed = JSON.parse(match[0]);
  return parsed.decisionStatus === "discussion" || parsed.decisionStatus === "decided"
    ? parsed.decisionStatus
    : null;
}

export async function generateDiscussionQuestion(
  title: string,
  outlook: string
): Promise<string> {
  const client = getClient();

  const prompt = `あなたは介護保険の情報を発信するキャラクター「ゴリ編集長」です。以下は記事内の「この先どうなるか、予想してみます」というパート（AIによる将来予測で、事実ではなく推測であると画面上に明記されています）です。

タイトル: ${title}
AIの予想: ${outlook}

この予想について、読者（介護事業者）がコメント欄で気軽に反応したくなるような問いかけを1つ考えてください。

条件:
- 40〜70字程度の1文
- 「この予想、当たると思いますか？」「あなたはどう予想しますか？」のように、AIの予想への賛否・自分なりの予想を気軽に書き込みたくなる問いかけにする
- 事業所の内部情報や実務対応を答えさせる聞き方は避ける（あくまで予想に対する意見・感想を聞く）
- 語尾は親しみやすく、押しつけがましくない
- 質問文のみを出力する（前置き・記号・引用符は不要）`;

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return text.trim().replace(/^["「]|["」]$/g, "").slice(0, 150);
}

export type SectionKind =
  | "why_relevant"
  | "what_changes"
  | "background"
  | "what_to_do"
  | "schedule"
  | "outlook";

export interface ContentSection {
  kind: SectionKind;
  type: "text" | "table" | "flow" | "list";
  heading: string;
  body?: string;
  headers?: string[];
  rows?: string[][];
  steps?: string[];
  items?: string[];
}

export interface StructuredContent {
  hookTitle: string;
  points: [string, string, string];
  importanceStars: number;
  urgencyStars: number;
  sections: ContentSection[];
}

// 未ログインユーザー向け：見出し（kind/type/heading）だけを残し本文を取り除く。
// CSSのぼかしだけでは本文がHTML/RSCペイロードにそのまま含まれてしまい、
// view-sourceやDevToolsで誰でも全文を読めてしまうため、サーバー側で除去する。
export function redactStructuredContentForGuest(content: StructuredContent): StructuredContent {
  return {
    ...content,
    sections: content.sections.map((s) => ({
      kind: s.kind,
      type: s.type,
      heading: s.heading,
    })),
  };
}

// カードは常にこの6種類・この順序で固定。読み手の「何が変わる？」という自然な思考の流れに沿わせる。
const SECTION_SPECS: { kind: SectionKind; defaultHeading: string; guide: string }[] = [
  {
    kind: "why_relevant",
    defaultHeading: "なぜ読む必要があるの？",
    guide: "読者（介護事業所の管理者・経営者本人）にとっての当事者性・影響を短く。type=\"text\"。",
  },
  {
    kind: "what_changes",
    defaultHeading: "何が変わるの？",
    guide: "変更点を具体的な数字・対象・施行日つきで詳しく。数値の前後比較があれば必ずtype=\"table\"（headers/rows）、変更項目の列挙ならtype=\"list\"（items）。このカードだけは短く済ませず、事実を厚めに書く。",
  },
  {
    kind: "background",
    defaultHeading: "なんでこんなことになってるの？",
    guide: "国がこの決定をした背景・意図をtype=\"text\"で。国を悪者にせず、意図を汲んで説明し反発を和らげる。",
  },
  {
    kind: "what_to_do",
    defaultHeading: "で、どうしたらいいの？",
    guide: "type=\"list\"か\"flow\"。可能なら「これまでのNG例／これからのOK例」のように行動レベルで対比させる。最後の項目・ステップは必ず「まずはこれだけやる」という1つに絞った最初の行動で締める。",
  },
  {
    kind: "schedule",
    defaultHeading: "実行スケジュール",
    guide: "type=\"flow\"か\"table\"。施行日・経過措置期間・申請締切などを時系列で。事実（原文に書かれている日付）のみを記載し、推測は一切含めない。",
  },
  {
    kind: "outlook",
    defaultHeading: "今後の見通し",
    guide: "type=\"text\"。長期的な制度の方向性についてのAIの予想。「〜と予想されます」「〜の可能性があります」のように、これは推測であるとわかる書き方にする（画面側にも注意書きが別途表示されるため、本文で過度に断定しない）。",
  },
];

export async function generateStructuredContent(
  title: string,
  rawText: string,
  pdfBase64?: string
): Promise<StructuredContent> {
  const client = getClient();

  const prompt = `あなたは介護保険の専門家アナリストです。以下の厚生労働省の発表資料を、忙しい介護事業所の管理者・経営者が「読まなくても内容を理解し、次の行動を起こせる」ように、思考プロセスを代わりに整理してカード形式にまとめてください。全文を要約するのではなく、読み手の頭の中にある疑問に、順番に答えていくイメージです。

タイトル: ${title}
${pdfBase64 ? "（添付PDFが本文です）" : `本文:\n${rawText.slice(0, 12000)}`}

以下のJSON形式のみで回答してください（他テキスト不要）:
{
  "hookTitle": "見出し（25字程度）",
  "points": [
    "最重要の結論を1つだけ言い切る（50文字以内・体言止め）",
    "施行日・対象・数値など補足事実（50文字以内・体言止め）",
    "実務への影響・対応すべきこと（50文字以内・体言止め）"
  ],
  "importanceStars": 重要度を1〜5の整数で,
  "urgencyStars": 緊急度を1〜5の整数で,
  "sections": [
    ${SECTION_SPECS.map((s) => `{ "kind": "${s.kind}", "type": "text|table|flow|list", "heading": "見出し（15文字以内）", "body/items/headers+rows/steps": "typeに応じて" }`).join(",\n    ")}
  ]
}

【hookTitleのルール】
- 「これを読むと何が変わるかが分かる」見出しにする
- 具体的な数字・対象（例：「訪問介護の加算、単位数が一部改定」）を使い、それ自体で興味を引く
- 年号・日付（「2025年」「令和8年」「7月14日」など）は一切含めない。発表日は画面側に別途正確な日付バッジで表示されるため、hookTitle側で日付に言及すると本文中の別の日付と混同して誤った情報になるリスクがある。時期を示したい場合も「まもなく」「今後」のような曖昧な表現に留める
- 感嘆符（！）や「大ピンチ」「必見」「衝撃」のような煽り語彙は禁止。かといって無味乾燥にもしない、その中間を狙う
- 正式なタイトル（"${title}"）とは別物。正式タイトルは画面側で別途小さく表示するので、hookTitleは分かりやすさ優先で書き換えてよい

【importanceStars / urgencyStars のルール】
- importance（重要度）＝事業運営への影響の大きさ、urgency（緊急度）＝対応の時間的な差し迫り度。この2つは独立した軸で、必ずしも連動しない
- 1と5は本当に稀な外れ値（1＝ほぼ影響なし、5＝全事業所に関わる極めて重大な内容）。ほとんどの記事は2〜4の範囲に収まるはず。安易に高評価へ寄せない

【sectionsのルール】
- 必ず上記6つを、この順序・このkindで過不足なく生成する（多すぎても少なすぎてもいけない）
${SECTION_SPECS.map((s, i) => `${i + 1}. kind="${s.kind}"（${s.defaultHeading}）: ${s.guide}`).join("\n")}

【type別の追加フィールド】
- "table": "headers": ["列名1","列名2"], "rows": [["値","値"]]
- "flow": "steps": ["ステップ1","ステップ2"]
- "list": "items": ["項目1","項目2"]
- "text": "body": "説明文"

【全体のトーン】
- 体言止め・事実ベースの端的な文体。感嘆符・煽り語彙は使わない
- 数字（単位数・加算率・日付・対象事業所数など）は分かる範囲で必ず具体的に書く`;

  const messageContent = pdfBase64
    ? [
        { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: pdfBase64 } },
        { type: "text" as const, text: prompt },
      ]
    : prompt;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: messageContent }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("structuredContent parse failed");

  const parsed = JSON.parse(match[0]);
  const rawSections: ContentSection[] = Array.isArray(parsed.sections) ? parsed.sections : [];

  // AIが順序やkindを誤っても画面が崩れないよう、6種を必ずこの順で揃える（欠けていれば空のプレースホルダーで補う）
  const sections: ContentSection[] = SECTION_SPECS.map((spec) => {
    const found = rawSections.find((s) => s?.kind === spec.kind);
    if (found) return { ...found, kind: spec.kind, heading: found.heading || spec.defaultHeading };
    return { kind: spec.kind, type: "text", heading: spec.defaultHeading, body: "内容を確認中です" };
  });

  const hookTitle = typeof parsed.hookTitle === "string" && parsed.hookTitle ? parsed.hookTitle : title;

  return {
    // AIが指示に反して日付を含めた場合、誤日付を表示するリスクを避けるため正式タイトルにフォールバックする
    hookTitle: containsDateLike(hookTitle) ? title : hookTitle,
    points: parsed.points ?? ["内容を確認中", "詳細は原文を参照", ""],
    importanceStars: clampStars(parsed.importanceStars),
    urgencyStars: clampStars(parsed.urgencyStars),
    sections,
  };
}

const DATE_LIKE_PATTERN = /(令和|平成|昭和)\s*\d+\s*年|\d{4}\s*年|\d{1,2}\s*月\s*\d{1,2}\s*日/;

function containsDateLike(text: string): boolean {
  return DATE_LIKE_PATTERN.test(text);
}

function clampStars(v: unknown): number {
  const n = typeof v === "number" ? Math.round(v) : 3;
  return Math.min(5, Math.max(1, n));
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

import Anthropic from "@anthropic-ai/sdk";

export interface SummarizableMessage {
  name: string;
  text: string;
  createdAt: Date;
}

const SUMMARY_MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const MAX_SUMMARY_POINTS = 4;

/**
 * AIが話題を整理する（app-specification.md 2章・7章）。
 * ANTHROPIC_API_KEY が設定されていれば Claude に要約させ、
 * 未設定ならキーワード頻度ベースの簡易ヒューリスティックにフォールバックする。
 */
export async function summarizeChat(messages: SummarizableMessage[]): Promise<string[]> {
  if (messages.length === 0) {
    return ["まだメッセージがありません。会話が始まるとここに話題が整理されます。"];
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      return await summarizeWithClaude(messages, apiKey);
    } catch (err) {
      console.error("Claude summarization failed, falling back to heuristic:", err);
    }
  }
  return summarizeWithHeuristic(messages);
}

async function summarizeWithClaude(
  messages: SummarizableMessage[],
  apiKey: string
): Promise<string[]> {
  const anthropic = new Anthropic({ apiKey });
  const transcript = messages
    .map((m) => `${m.name}: ${m.text}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: SUMMARY_MODEL,
    max_tokens: 300,
    system:
      "あなたは少人数のグループチャットの会話から話題を整理するアシスタントです。" +
      `会話の要点を短い日本語の箇条書きで最大${MAX_SUMMARY_POINTS}件、` +
      "改行区切りのプレーンテキストで出力してください（先頭に記号や番号は付けない）。" +
      "盛り上がっている話題、一緒に遊べそうな日時、共通の興味を優先してください。",
    messages: [{ role: "user", content: transcript }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const points = text
    .split("\n")
    .map((line) => line.replace(/^[-・*\d.]+\s*/, "").trim())
    .filter(Boolean)
    .slice(0, MAX_SUMMARY_POINTS);

  return points.length > 0 ? points : summarizeWithHeuristic(messages);
}

const STOPWORDS = new Set([
  "です", "ます", "した", "して", "いる", "ある", "この", "その", "あの",
  "また", "けど", "でも", "とか", "って", "から", "ので", "なら", "そう",
  "the", "and", "for", "with", "that", "this",
]);

function summarizeWithHeuristic(messages: SummarizableMessage[]): string[] {
  const points: string[] = [];

  const participants = new Set(messages.map((m) => m.name));
  const latest = messages[messages.length - 1];
  const latestHour = latest.createdAt.getHours();
  const timeOfDay = latestHour >= 18 || latestHour < 4 ? "夜" : latestHour >= 12 ? "昼" : "朝";

  points.push(
    `${timeOfDay}の時間帯に${participants.size}人が会話中（直近${messages.length}件のメッセージ）`
  );

  const keywords = extractKeywords(messages.map((m) => m.text).join(" "), 3);
  if (keywords.length > 0) {
    points.push(`よく出てきた話題: ${keywords.join("・")}`);
  }

  const inviteLike = messages.filter((m) => /(行きませ|やりませ|遊びま|どう？|どうですか)/.test(m.text));
  if (inviteLike.length > 0) {
    points.push("「また遊びたい」という誘いの声が出ています。募集を作るのにちょうど良いタイミングかも");
  }

  return points.slice(0, MAX_SUMMARY_POINTS);
}

function extractKeywords(text: string, count: number): string[] {
  const tokens = text
    .replace(/[！-／：-＠［-｀｛-～、。「」『』・？!?.,]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));

  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([word]) => word);
}

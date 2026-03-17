import { NextRequest, NextResponse } from "next/server";
import { parseJsonFromAi } from "@/services/ai-json";

const AI_API_BASE_URL = process.env.AI_API_BASE_URL || "https://api.openai.com/v1";
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

type RecommendedBook = {
  title: string;
  author: string;
  description: string;
  level: "入门" | "进阶" | "高级";
  reason: string;
};

type LearningProfileDraftLike = {
  topic?: unknown;
  goal?: unknown;
  currentLevel?: unknown;
  timeBudget?: unknown;
  learningStyle?: unknown;
  background?: unknown;
};

function isMockMode(): boolean {
  return !AI_API_KEY || AI_API_KEY === "";
}

function normalizeLevel(level: unknown): RecommendedBook["level"] {
  if (level === "入门" || level === "进阶" || level === "高级") return level;
  if (typeof level !== "string") return "入门";
  const text = level.trim();
  if (text.includes("高级")) return "高级";
  if (text.includes("进阶")) return "进阶";
  return "入门";
}

function generateMockBooks(topic: string): RecommendedBook[] {
  const subject = topic || "该主题";
  return [
    {
      title: `${subject} 入门经典`,
      author: "权威作者",
      description: `最适合初学者的 ${subject} 入门书籍`,
      level: "入门",
      reason: "内容浅显易懂，适合零基础学习者",
    },
    {
      title: `${subject} 实战指南`,
      author: "实战专家",
      description: `通过实际案例学习 ${subject}`,
      level: "进阶",
      reason: "理论与实践结合，适合有一定基础的学习者",
    },
    {
      title: `${subject} 高级教程`,
      author: "资深专家",
      description: `深入探讨 ${subject} 的高级主题`,
      level: "高级",
      reason: "内容深入，适合想要精通的学习者",
    },
  ];
}

function coerceProfile(input: unknown): {
  topic: string;
  goal: string;
  currentLevel: string;
  timeBudget: number;
  learningStyle: string;
  background: string;
} {
  const record = (input && typeof input === "object" ? (input as LearningProfileDraftLike) : {}) as LearningProfileDraftLike;

  const topic = typeof record.topic === "string" ? record.topic : "未提供";
  const goal = typeof record.goal === "string" ? record.goal : "未提供";
  const currentLevel = typeof record.currentLevel === "string" ? record.currentLevel : "beginner";
  const timeBudget =
    typeof record.timeBudget === "number"
      ? record.timeBudget
      : typeof record.timeBudget === "string"
        ? Number.parseInt(record.timeBudget, 10) || 0
        : 0;
  const learningStyle = typeof record.learningStyle === "string" ? record.learningStyle : "mixed";
  const background = typeof record.background === "string" ? record.background : "";

  return {
    topic,
    goal,
    currentLevel,
    timeBudget,
    learningStyle,
    background,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { profile?: unknown };
    const profile = coerceProfile(body.profile);

    if (isMockMode()) {
      return NextResponse.json({ success: true, books: generateMockBooks(profile.topic) });
    }

    const prompt = `作为一个专业的学习顾问，请根据以下学习画像推荐 3-5 本最适合的书籍。

学习画像：
- 学习主题: ${profile.topic}
- 学习目标: ${profile.goal}
- 当前水平: ${profile.currentLevel}
- 每周学习时间: ${profile.timeBudget || "未提供"} 小时
- 学习风格: ${profile.learningStyle}
- 背景: ${profile.background || "未提供"}

要求：
1) 推荐真实存在、广受好评的书籍，优先推荐中文书籍或经典英文书籍的中文译本。
2) 覆盖不同难度层级（入门/进阶/高级），并解释推荐理由（结合学习目标与背景）。
3) 只返回 JSON 数组，不要包含任何其他文字。

返回格式：
[
  {
    "title": "书名",
    "author": "作者",
    "description": "书籍简介（一句话）",
    "level": "入门/进阶/高级",
    "reason": "推荐理由"
  }
]`;

    const response = await fetch(`${AI_API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "你是一个专业的学习顾问，擅长根据学习者画像推荐书籍。只返回 JSON 数组格式，不要包含任何其他文字。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return NextResponse.json(
        { success: true, books: generateMockBooks(profile.topic) },
        { status: 200 }
      );
    }

    const data = (await response.json()) as any;
    const content = data?.choices?.[0]?.message?.content;

    const parsed = typeof content === "string" ? parseJsonFromAi(content) : null;
    if (!Array.isArray(parsed)) {
      return NextResponse.json({ success: true, books: generateMockBooks(profile.topic) });
    }

    const books = (parsed as Array<Record<string, unknown>>)
      .filter((item) => item && typeof item === "object")
      .slice(0, 5)
      .map((item) => ({
        title: typeof item.title === "string" ? item.title : "未知书籍",
        author: typeof item.author === "string" ? item.author : "未知作者",
        description: typeof item.description === "string" ? item.description : "",
        level: normalizeLevel(item.level),
        reason: typeof item.reason === "string" ? item.reason : "",
      }));

    return NextResponse.json({ success: true, books });
  } catch (error) {
    console.error("Error generating recommended books:", error);
    return NextResponse.json({ success: false, error: "推荐失败" }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const AI_API_BASE_URL = process.env.AI_API_BASE_URL || "https://api.openai.com/v1";
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

function isMockMode(): boolean {
  return !AI_API_KEY || AI_API_KEY === "";
}

function parseJsonField<T>(field: string | null, defaultValue: T): T {
  if (!field) return defaultValue;
  try {
    return JSON.parse(field) as T;
  } catch {
    return defaultValue;
  }
}

function normalizeHistory(history: unknown): Array<{ role: "assistant" | "user"; content: string }> {
  if (!Array.isArray(history)) {
    return [];
  }

  const messages: Array<{ role: "assistant" | "user"; content: string }> = [];

  for (const item of history.slice(-12)) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const role = record.role;
    const content = record.content;

    if ((role === "assistant" || role === "user") && typeof content === "string" && content.trim()) {
      messages.push({ role, content: content.trim().slice(0, 2000) });
    }
  }

  return messages;
}

function truncate(text: string, maxChars: number): string {
  const normalized = (text ?? "").trim();
  if (normalized.length <= maxChars) {
    return normalized;
  }
  return `${normalized.slice(0, maxChars)}…`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      message?: unknown;
      history?: unknown;
    };

    const message = body.message;
    if (typeof message !== "string" || message.trim() === "") {
      return NextResponse.json({ success: false, error: "缺少消息内容" }, { status: 400 });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        outline: {
          include: {
            project: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ success: false, error: "章节不存在" }, { status: 404 });
    }

    const profile = lesson.outline.project.profile;
    const topic = profile?.topic || "未知主题";
    const goal = profile?.goal || "掌握相关知识";
    const currentLevel = profile?.currentLevel || "beginner";

    const objective = parseJsonField<string[]>(lesson.objective ?? null, []);
    const summary = lesson.summary || "";
    const content = lesson.content || "";
    const contentExcerpt = truncate(content, 6500);

    if (isMockMode()) {
      return NextResponse.json({
        success: true,
        reply: `（Mock）我收到了你的问题：${message.trim()}\n\n你可以继续追问本章的概念、代码示例或实战练习。`,
      });
    }

    const system = `你是“智学”平台的 AI 学习教练，面向中文用户回答问题。
你需要基于给定的课程章节内容提供帮助，输出清晰、可操作的建议，必要时给出可复制的代码与排错步骤。
若问题与本章无关或信息不足，先提出 1-2 个澄清问题，不要编造事实。

学习者画像：
- 主题：${topic}
- 目标：${goal}
- 水平：${currentLevel}

章节信息：
- 标题：${lesson.title}
- 目标：${objective.length ? objective.join("；") : "（无）"}
- 总结：${summary ? truncate(summary, 600) : "（无）"}

章节内容（Markdown，可能截断）：
${contentExcerpt || "（无）"}`;

    const history = normalizeHistory(body.history);
    const userPrompt = `用户问题：${message.trim()}`;

    const response = await fetch(`${AI_API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: system },
          ...history,
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return NextResponse.json(
        { success: false, error: "AI 服务暂时不可用" },
        { status: 502 }
      );
    }

    const data = (await response.json()) as any;
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply || typeof reply !== "string") {
      return NextResponse.json(
        { success: false, error: "AI 返回为空" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, reply: reply.trim() });
  } catch (error) {
    console.error("Error lesson chat:", error);
    return NextResponse.json({ success: false, error: "对话失败" }, { status: 500 });
  }
}


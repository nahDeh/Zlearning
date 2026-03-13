import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

interface LessonContent {
  objective: string[];
  prerequisites: string[];
  content: string;
  examples: { title: string; code?: string; explanation: string }[];
  summary: string;
  estimatedMinutes: number;
}

function isMockMode(): boolean {
  return !OPENAI_API_KEY || OPENAI_API_KEY === "";
}

async function generateLessonContent(
  chapterTitle: string,
  chapterDescription: string,
  difficulty: string,
  topic: string,
  goal: string,
  currentLevel: string
): Promise<LessonContent> {
  if (isMockMode()) {
    return generateMockLessonContent(chapterTitle, chapterDescription);
  }

  const prompt = `你是一位专业的教育内容创作者。请为以下章节生成详细的学习内容。

课程主题: ${topic}
学习目标: ${goal}
学习者水平: ${currentLevel}

章节信息:
- 标题: ${chapterTitle}
- 描述: ${chapterDescription}
- 难度: ${difficulty}

请生成以下内容，以 JSON 格式返回（不要包含任何其他文字）：
{
  "objective": ["学习目标1", "学习目标2", "学习目标3"],
  "prerequisites": ["前置知识1", "前置知识2"],
  "content": "详细的核心内容，使用 Markdown 格式，包含多个段落和子标题",
  "examples": [
    {
      "title": "示例标题",
      "code": "示例代码（如果适用）",
      "explanation": "示例解释"
    }
  ],
  "summary": "本章节的总结",
  "estimatedMinutes": 预计学习时间（分钟，数字）
}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "你是一位专业的教育内容创作者，擅长创建结构清晰、内容丰富的学习材料。请只返回 JSON 格式的结果，不要包含任何其他文字。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status);
      return generateMockLessonContent(chapterTitle, chapterDescription);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return generateMockLessonContent(chapterTitle, chapterDescription);
    }

    const lessonContent = JSON.parse(content);
    return {
      objective: lessonContent.objective || [],
      prerequisites: lessonContent.prerequisites || [],
      content: lessonContent.content || "",
      examples: lessonContent.examples || [],
      summary: lessonContent.summary || "",
      estimatedMinutes: lessonContent.estimatedMinutes || 30,
    };
  } catch (error) {
    console.error("Error generating lesson content:", error);
    return generateMockLessonContent(chapterTitle, chapterDescription);
  }
}

function generateMockLessonContent(
  chapterTitle: string,
  chapterDescription: string
): LessonContent {
  return {
    objective: [
      `理解 ${chapterTitle} 的核心概念`,
      `掌握 ${chapterTitle} 的基本操作`,
      `能够应用 ${chapterTitle} 解决实际问题`,
    ],
    prerequisites: ["基础知识", "基本概念理解"],
    content: `## ${chapterTitle}\n\n${chapterDescription}\n\n### 核心概念\n\n本章节将介绍 ${chapterTitle} 的核心概念和基础知识。\n\n### 详细内容\n\n1. 第一个要点\n2. 第二个要点\n3. 第三个要点\n\n### 实践建议\n\n建议在学习过程中多动手实践，加深理解。`,
    examples: [
      {
        title: `${chapterTitle} 基础示例`,
        code: "// 示例代码\nconsole.log('Hello, World!');",
        explanation: `这是一个展示 ${chapterTitle} 基础用法的示例。`,
      },
    ],
    summary: `本章节介绍了 ${chapterTitle} 的核心概念和基本操作，为后续学习打下基础。`,
    estimatedMinutes: 30,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { outlineId } = body;

    if (!outlineId) {
      return NextResponse.json(
        { error: "缺少 outlineId 参数" },
        { status: 400 }
      );
    }

    const outline = await prisma.outline.findUnique({
      where: { id: outlineId },
      include: {
        project: {
          include: {
            profile: true,
          },
        },
        lessons: true,
      },
    });

    if (!outline) {
      return NextResponse.json({ error: "大纲不存在" }, { status: 404 });
    }

    const chapters = outline.content as Array<{
      title: string;
      description: string;
      estimatedMinutes: number;
      difficulty: string;
      orderIndex: number;
    }>;

    if (!Array.isArray(chapters) || chapters.length === 0) {
      return NextResponse.json({ error: "大纲内容为空" }, { status: 400 });
    }

    const profile = outline.project.profile;
    const topic = profile?.topic || "未知主题";
    const goal = profile?.goal || "掌握相关知识";
    const currentLevel = profile?.currentLevel || "beginner";

    const existingLessons = outline.lessons;
    if (existingLessons.length > 0) {
      await prisma.lesson.deleteMany({
        where: { outlineId },
      });
    }

    const createdLessons = [];

    for (const chapter of chapters) {
      const lessonContent = await generateLessonContent(
        chapter.title,
        chapter.description,
        chapter.difficulty,
        topic,
        goal,
        currentLevel
      );

      const lesson = await prisma.lesson.create({
        data: {
          outlineId,
          title: chapter.title,
          orderIndex: chapter.orderIndex,
          objective: lessonContent.objective,
          prerequisites: lessonContent.prerequisites,
          content: lessonContent.content,
          examples: lessonContent.examples,
          summary: lessonContent.summary,
          estimatedMinutes: lessonContent.estimatedMinutes,
        },
      });

      createdLessons.push(lesson);
    }

    return NextResponse.json({
      success: true,
      outlineId,
      projectId: outline.projectId,
      lessonCount: createdLessons.length,
      lessons: createdLessons.map((l) => ({
        id: l.id,
        title: l.title,
        orderIndex: l.orderIndex,
      })),
    });
  } catch (error) {
    console.error("Error generating course:", error);
    return NextResponse.json(
      { error: "课程生成失败" },
      { status: 500 }
    );
  }
}

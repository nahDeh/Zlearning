import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseJsonFromAi } from "@/services/ai-json";

const AI_API_BASE_URL = process.env.AI_API_BASE_URL || "https://api.openai.com/v1";
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

interface LessonContent {
  objective: string[];
  prerequisites: string[];
  content: string;
  examples: { title: string; code?: string; explanation: string }[];
  summary: string;
  estimatedMinutes: number;
}

interface OutlineChapter {
  title: string;
  description: string;
  estimatedMinutes: number;
  difficulty: string;
  orderIndex: number;
}

interface LessonInsertPayload {
  title: string;
  orderIndex: number;
  objective: string;
  prerequisites: string;
  content: string;
  examples: string;
  summary: string;
  estimatedMinutes: number;
}

function isMockMode(): boolean {
  return !AI_API_KEY || AI_API_KEY === "";
}

function generateMockLessonContent(
  chapterTitle: string,
  chapterDescription: string
): LessonContent {
  return {
    objective: [
      `理解 ${chapterTitle} 的核心概念`,
      `掌握 ${chapterTitle} 的基本使用方式`,
      `能够把 ${chapterTitle} 应用到实际问题`,
    ],
    prerequisites: ["基础知识", "基本概念理解"],
    content: `## ${chapterTitle}\n\n${chapterDescription}\n\n### 核心概念\n\n本章会围绕 ${chapterTitle} 展开讲解。\n\n### 关键要点\n\n1. 先理解定义\n2. 再看常见用法\n3. 最后结合实际练习`,
    examples: [
      {
        title: `${chapterTitle} 示例`,
        code: "// example\nconsole.log('Hello, world!');",
        explanation: `这个示例展示了 ${chapterTitle} 的基本思路。`,
      },
    ],
    summary: `本章总结了 ${chapterTitle} 的核心知识点。`,
    estimatedMinutes: 30,
  };
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

  const prompt = `You are an instructional designer. Generate lesson content as JSON only.
Topic: ${topic}
Goal: ${goal}
Current level: ${currentLevel}
Chapter title: ${chapterTitle}
Chapter description: ${chapterDescription}
Difficulty: ${difficulty}

Return JSON with:
{
  "objective": ["..."],
  "prerequisites": ["..."],
  "content": "markdown content",
  "examples": [
    {
      "title": "example title",
      "code": "optional code",
      "explanation": "example explanation"
    }
  ],
  "summary": "lesson summary",
  "estimatedMinutes": 30
}`;

  try {
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
            content: "Return valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      return generateMockLessonContent(chapterTitle, chapterDescription);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    if (!content) {
      return generateMockLessonContent(chapterTitle, chapterDescription);
    }

    const lessonContent = parseJsonFromAi(content);
    if (!lessonContent || typeof lessonContent !== "object" || Array.isArray(lessonContent)) {
      throw new Error("Invalid lesson content JSON");
    }

    const lessonContentObj = lessonContent as Record<string, unknown>;
    return {
      objective: Array.isArray(lessonContentObj.objective)
        ? (lessonContentObj.objective as string[])
        : [],
      prerequisites: Array.isArray(lessonContentObj.prerequisites)
        ? (lessonContentObj.prerequisites as string[])
        : [],
      content: typeof lessonContentObj.content === "string" ? lessonContentObj.content : "",
      examples: Array.isArray(lessonContentObj.examples)
        ? (lessonContentObj.examples as LessonContent["examples"])
        : [],
      summary: typeof lessonContentObj.summary === "string" ? lessonContentObj.summary : "",
      estimatedMinutes: Number(lessonContentObj.estimatedMinutes) || 30,
    };
  } catch (error) {
    console.error("Error generating lesson content:", error);
    return generateMockLessonContent(chapterTitle, chapterDescription);
  }
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

    let chapters: OutlineChapter[];
    try {
      chapters = JSON.parse(outline.content) as OutlineChapter[];
    } catch {
      return NextResponse.json({ error: "大纲内容格式错误" }, { status: 400 });
    }

    if (!Array.isArray(chapters) || chapters.length === 0) {
      return NextResponse.json({ error: "大纲内容为空" }, { status: 400 });
    }

    const profile = outline.project.profile;
    const topic = profile?.topic || "Unknown topic";
    const goal = profile?.goal || "Master the key concepts";
    const currentLevel = profile?.currentLevel || "beginner";

    const lessonPayloads: LessonInsertPayload[] = [];

    for (const chapter of chapters) {
      const lessonContent = await generateLessonContent(
        chapter.title,
        chapter.description,
        chapter.difficulty,
        topic,
        goal,
        currentLevel
      );

      lessonPayloads.push({
        title: chapter.title,
        orderIndex: chapter.orderIndex,
        objective: JSON.stringify(lessonContent.objective),
        prerequisites: JSON.stringify(lessonContent.prerequisites),
        content: lessonContent.content,
        examples: JSON.stringify(lessonContent.examples),
        summary: lessonContent.summary,
        estimatedMinutes: lessonContent.estimatedMinutes,
      });
    }

    const createdLessons = await prisma.$transaction(async (tx) => {
      if (outline.lessons.length > 0) {
        await tx.lesson.deleteMany({
          where: { outlineId },
        });
      }

      const lessons: Array<{ id: string; title: string; orderIndex: number }> = [];

      for (const lessonData of lessonPayloads) {
        const lesson = await tx.lesson.create({
          data: {
            outlineId,
            ...lessonData,
          },
        });

        lessons.push({
          id: lesson.id,
          title: lesson.title,
          orderIndex: lesson.orderIndex,
        });
      }

      await tx.learningProject.update({
        where: { id: outline.projectId },
        data: {
          currentLessonId: lessons[0]?.id ?? null,
        },
      });

      return lessons;
    });

    return NextResponse.json({
      success: true,
      outlineId,
      projectId: outline.projectId,
      lessonCount: createdLessons.length,
      lessons: createdLessons,
    });
  } catch (error) {
    console.error("Error generating course:", error);
    return NextResponse.json(
      { error: "课程生成失败" },
      { status: 500 }
    );
  }
}

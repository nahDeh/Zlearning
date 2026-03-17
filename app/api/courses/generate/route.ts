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

  const prompt = `你是一位专业的教学设计师与一线工程师。请为以下章节生成“可直接照着做”的课程内容，并突出实战练习。

课程主题：${topic}
学习目标：${goal}
学习者水平：${currentLevel}

章节信息：
- 标题：${chapterTitle}
- 描述：${chapterDescription}
- 难度：${difficulty}

输出要求：
1) content 必须使用 Markdown，并包含清晰的标题层级（使用 ## / ###），至少包含以下二级标题：
- ## 核心讲解（拆成 3-6 个 ### 小节，每个小节给出要点 + 代码/命令示例）
- ## 实战练习（至少 2 个练习：练习 1“跟做”、练习 2“挑战”）
- ## 常见坑与排错（给出典型错误、原因、排查步骤）
- ## 小结（3-6 条要点）
2) 在“实战练习”中，每个练习必须包含：目标、输入/条件、输出/产出、步骤提示、验收标准；练习要贴近真实工作场景，且与本章知识点强相关。
3) objective 3-5 条；prerequisites 2-4 条；examples 至少 2 个，代码可复制可运行（必要时给出依赖/环境说明）。
4) estimatedMinutes 为 30-120 的整数（分钟）。
5) 只返回 JSON 对象，不要包含任何其他文字。

请按以下 JSON 结构返回（字段名/类型必须严格一致）：
{
  "objective": ["学习目标1", "学习目标2", "学习目标3"],
  "prerequisites": ["前置知识1", "前置知识2"],
  "content": "Markdown 内容（包含 ##/### 标题与实战练习）",
  "examples": [
    {
      "title": "示例标题",
      "code": "示例代码（如果适用）",
      "explanation": "示例解释"
    }
  ],
  "summary": "本章节的总结",
  "estimatedMinutes": 60
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
            content:
              "你是专业的教学设计师。只返回 JSON 对象，不要输出任何解释性文字，且 content 必须包含“实战练习”章节。",
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

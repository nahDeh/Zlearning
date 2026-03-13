import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OutlineChapter, Difficulty } from "@/types/outline";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function isMockMode(): boolean {
  return !OPENAI_API_KEY || OPENAI_API_KEY === "";
}

async function generateOutlineWithAI(
  extractedText: string,
  profile: {
    topic: string;
    goal: string;
    currentLevel: string;
    timeBudget: number;
    learningStyle: string;
  }
): Promise<OutlineChapter[]> {
  if (isMockMode()) {
    return generateMockOutline();
  }

  const prompt = `你是一个专业的课程设计师。请根据以下学习资料和学习者画像，设计一个学习大纲。

学习者画像：
- 学习主题: ${profile.topic}
- 学习目标: ${profile.goal}
- 当前水平: ${profile.currentLevel}
- 每周学习时间: ${profile.timeBudget} 小时
- 学习风格: ${profile.learningStyle}

学习资料内容（节选）：
${extractedText.slice(0, 4000)}

请生成一个包含 5-10 个章节的学习大纲。每个章节需要包含：
- title: 章节标题（简洁明了）
- description: 章节描述（简要说明学习内容）
- estimatedMinutes: 预计学习时间（分钟）
- difficulty: 难度等级（easy/medium/hard）

请以 JSON 数组格式返回，格式如下：
[
  {
    "title": "章节标题",
    "description": "章节描述",
    "estimatedMinutes": 30,
    "difficulty": "easy"
  }
]

只返回 JSON 数组，不要包含任何其他文字。`;

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
            content: "你是一个专业的课程设计师，擅长根据学习资料和学习者需求设计结构化的学习大纲。请只返回 JSON 格式的结果。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status);
      return generateMockOutline();
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return generateMockOutline();
    }

    const chapters = JSON.parse(content);
    return chapters.map((chapter: Partial<OutlineChapter>, index: number) => ({
      title: chapter.title || `第 ${index + 1} 章`,
      description: chapter.description || "",
      estimatedMinutes: chapter.estimatedMinutes || 30,
      difficulty: (chapter.difficulty as Difficulty) || "medium",
      orderIndex: index,
    }));
  } catch (error) {
    console.error("Error generating outline:", error);
    return generateMockOutline();
  }
}

function generateMockOutline(): OutlineChapter[] {
  return [
    {
      title: "基础概念入门",
      description: "了解核心概念和基本术语，建立知识框架",
      estimatedMinutes: 30,
      difficulty: "easy",
      orderIndex: 0,
    },
    {
      title: "核心原理深入",
      description: "深入理解核心原理和关键机制",
      estimatedMinutes: 45,
      difficulty: "medium",
      orderIndex: 1,
    },
    {
      title: "实践应用技巧",
      description: "通过实例学习实际应用方法和技巧",
      estimatedMinutes: 60,
      difficulty: "medium",
      orderIndex: 2,
    },
    {
      title: "进阶技术探索",
      description: "探索高级技术和进阶应用场景",
      estimatedMinutes: 45,
      difficulty: "hard",
      orderIndex: 3,
    },
    {
      title: "综合实战项目",
      description: "综合运用所学知识完成实战项目",
      estimatedMinutes: 90,
      difficulty: "hard",
      orderIndex: 4,
    },
  ];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;
    const body = await request.json().catch(() => ({}));
    const { regenerate = false } = body;

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: {
        project: {
          include: {
            profile: true,
            outlines: {
              where: { isActive: true },
              orderBy: { version: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!material) {
      return NextResponse.json({ error: "资料不存在" }, { status: 404 });
    }

    if (!material.extractedText) {
      return NextResponse.json({ error: "资料尚未解析完成" }, { status: 400 });
    }

    const profile = material.project?.profile;
    if (!profile) {
      return NextResponse.json({ error: "项目缺少学习画像" }, { status: 400 });
    }

    if (!regenerate && material.project?.outlines && material.project.outlines.length > 0) {
      const existingOutline = material.project.outlines[0];
      return NextResponse.json({
        success: true,
        outline: {
          id: existingOutline.id,
          chapters: existingOutline.content as OutlineChapter[],
          version: existingOutline.version,
        },
      });
    }

    const chapters = await generateOutlineWithAI(material.extractedText, {
      topic: profile.topic,
      goal: profile.goal,
      currentLevel: profile.currentLevel,
      timeBudget: profile.timeBudget,
      learningStyle: profile.learningStyle || "mixed",
    });

    if (material.project?.outlines && material.project.outlines.length > 0) {
      await prisma.outline.updateMany({
        where: { projectId: material.projectId, isActive: true },
        data: { isActive: false },
      });
    }

    const newVersion = material.project?.outlines?.[0]?.version
      ? material.project.outlines[0].version + 1
      : 1;

    const outline = await prisma.outline.create({
      data: {
        projectId: material.projectId,
        version: newVersion,
        content: chapters,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      outline: {
        id: outline.id,
        chapters,
        version: outline.version,
      },
    });
  } catch (error) {
    console.error("生成大纲错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成大纲失败" },
      { status: 500 }
    );
  }
}

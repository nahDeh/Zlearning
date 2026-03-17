import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OutlineChapter, Difficulty } from "@/types/outline";
import { parseJsonFromAi } from "@/services/ai-json";

const AI_API_BASE_URL = process.env.AI_API_BASE_URL || "https://api.openai.com/v1";
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

function isMockMode(): boolean {
  return !AI_API_KEY || AI_API_KEY === "";
}

function parseOutlineContent(content: string): OutlineChapter[] {
  try {
    return JSON.parse(content) as OutlineChapter[];
  } catch {
    return [];
  }
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

  const prompt = `你是资深课程设计师/教学设计师。请基于“学习者画像 + 学习资料（节选）”，设计一个可落地、以实战为导向的学习大纲。

学习者画像：
- 学习主题：${profile.topic}
- 学习目标：${profile.goal}
- 当前水平：${profile.currentLevel}
- 每周学习时间：${profile.timeBudget} 小时
- 学习风格：${profile.learningStyle}

学习资料内容（节选）：
${extractedText.slice(0, 4000)}

输出要求：
1. 生成 5-10 个章节，难度循序渐进，内容尽量贴合资料（避免凭空发散）。
2. 每个章节必须包含：
   - title：章节标题（动词+名词，简洁明确，避免泛泛如“进阶”“综合”）
   - description：2-4 句中文描述，必须包含三部分：
     (1) 本章核心技能/知识点
     (2) 典型应用场景/工作任务
     (3) 实战任务：一句话写清“要做什么 + 产出什么”，必须以“实战任务：”开头
   - estimatedMinutes：30-120 的整数（分钟）
   - difficulty：easy|medium|hard
3. 约束：
   - 第 1 章为入门与环境/基础概念
   - 至少 1 章为综合实战项目（建议最后一章，title 包含“实战项目”或“综合项目”，description 的实战任务要更具体）
   - 各章节 title 不要重复
4. 仅返回 JSON 数组，不要任何额外文字。

JSON 示例：
[
  {
    "title": "章节标题",
    "description": "章节描述…… 实战任务：……",
    "estimatedMinutes": 60,
    "difficulty": "easy"
  }
]`;

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
              "你是资深课程设计师，擅长把知识点转化为可执行的学习路径与实战任务。只返回 JSON 数组，不要输出任何解释性文字。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return generateMockOutline();
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return generateMockOutline();
    }

    const parsed = parseJsonFromAi(content);
    if (!Array.isArray(parsed)) {
      return generateMockOutline();
    }

    const chapters = parsed as Array<Partial<OutlineChapter>>;
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

async function createOrReuseOutline(
  projectId: string,
  chapters: OutlineChapter[],
  regenerate: boolean
) {
  return prisma.$transaction(async (tx) => {
    // Acquire a write lock early (especially important for SQLite) to avoid
    // concurrent requests computing the same next `version` and creating duplicates.
    await tx.outline.updateMany({
      where: { projectId, id: "__outline_lock__" },
      data: { isActive: false },
    });

    const activeOutline = await tx.outline.findFirst({
      where: { projectId, isActive: true },
      orderBy: { version: "desc" },
    });

    if (!regenerate && activeOutline) {
      return { outline: activeOutline, reusedExisting: true };
    }

    const latestOutline = await tx.outline.findFirst({
      where: { projectId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    await tx.outline.updateMany({
      where: { projectId, isActive: true },
      data: { isActive: false },
    });

    const outline = await tx.outline.create({
      data: {
        projectId,
        version: (latestOutline?.version ?? 0) + 1,
        content: JSON.stringify(chapters),
        isActive: true,
      },
    });

    return { outline, reusedExisting: false };
  });
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
          chapters: parseOutlineContent(existingOutline.content),
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

    const { outline, reusedExisting } = await createOrReuseOutline(
      material.projectId,
      chapters,
      regenerate
    );

    return NextResponse.json({
      success: true,
      outline: {
        id: outline.id,
        chapters: reusedExisting ? parseOutlineContent(outline.content) : chapters,
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

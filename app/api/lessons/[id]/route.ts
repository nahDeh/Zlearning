import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

function parseJsonField<T>(field: string | null, defaultValue: T): T {
  if (!field) return defaultValue;
  try {
    return JSON.parse(field) as T;
  } catch {
    return defaultValue;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        outline: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                orderIndex: true,
              },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "章节不存在" }, { status: 404 });
    }

    return NextResponse.json({
      id: lesson.id,
      outlineId: lesson.outlineId,
      title: lesson.title,
      orderIndex: lesson.orderIndex,
      objective: parseJsonField<string[]>(lesson.objective, []),
      prerequisites: parseJsonField<string[]>(lesson.prerequisites, []),
      content: lesson.content,
      examples: parseJsonField<Array<{ title: string; code?: string; explanation: string }>>(lesson.examples, []),
      summary: lesson.summary,
      estimatedMinutes: lesson.estimatedMinutes,
      outline: {
        id: lesson.outline.id,
        projectId: lesson.outline.projectId,
        lessons: lesson.outline.lessons,
      },
    });
  } catch (error) {
    console.error("Error fetching lesson:", error);
    return NextResponse.json(
      { error: "获取章节失败" },
      { status: 500 }
    );
  }
}

function normalizeStringArray(input: unknown): string[] | null {
  if (!Array.isArray(input)) {
    return null;
  }

  const items = input
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return items;
}

function normalizeExamples(
  input: unknown
): Array<{ title: string; code?: string; explanation: string }> | null {
  if (!Array.isArray(input)) {
    return null;
  }

  const examples: Array<{ title: string; code?: string; explanation: string }> = [];

  for (const item of input) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    const title = typeof record.title === "string" ? record.title.trim() : "";
    const explanation =
      typeof record.explanation === "string" ? record.explanation.trim() : "";

    if (!title || !explanation) {
      continue;
    }

    const example: { title: string; code?: string; explanation: string } = {
      title,
      explanation,
    };

    if (typeof record.code === "string" && record.code.trim()) {
      example.code = record.code;
    }

    examples.push(example);
  }

  return examples;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const updateData: Prisma.LessonUpdateInput = {};

    if (typeof body.title === "string") {
      updateData.title = body.title.trim();
    }

    if (typeof body.content === "string") {
      updateData.content = body.content;
    }

    if (typeof body.summary === "string") {
      updateData.summary = body.summary;
    }

    if (body.estimatedMinutes === null || typeof body.estimatedMinutes === "number") {
      updateData.estimatedMinutes =
        body.estimatedMinutes === null
          ? null
          : Math.max(0, Math.round(body.estimatedMinutes));
    }

    if ("objective" in body) {
      const objective = normalizeStringArray(body.objective);
      if (!objective) {
        return NextResponse.json({ error: "objective 格式错误" }, { status: 400 });
      }
      updateData.objective = JSON.stringify(objective);
    }

    if ("prerequisites" in body) {
      const prerequisites = normalizeStringArray(body.prerequisites);
      if (!prerequisites) {
        return NextResponse.json(
          { error: "prerequisites 格式错误" },
          { status: 400 }
        );
      }
      updateData.prerequisites = JSON.stringify(prerequisites);
    }

    if ("examples" in body) {
      const examples = normalizeExamples(body.examples);
      if (!examples) {
        return NextResponse.json({ error: "examples 格式错误" }, { status: 400 });
      }
      updateData.examples = JSON.stringify(examples);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "缺少可更新字段" }, { status: 400 });
    }

    const lesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      lesson: {
        id: lesson.id,
        outlineId: lesson.outlineId,
      },
    });
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json({ error: "更新章节失败" }, { status: 500 });
  }
}

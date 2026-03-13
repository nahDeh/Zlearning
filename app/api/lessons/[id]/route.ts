import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OutlineChapter } from "@/types/outline";

function parseOutlineContent(content: string): OutlineChapter[] {
  try {
    return JSON.parse(content) as OutlineChapter[];
  } catch {
    return [];
  }
}

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

    const outline = await prisma.outline.findUnique({
      where: { id },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            orderIndex: true,
            objective: true,
            content: true,
            estimatedMinutes: true,
          },
          orderBy: { orderIndex: "asc" },
        },
        project: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!outline) {
      return NextResponse.json({ error: "大纲不存在" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      outline: {
        id: outline.id,
        projectId: outline.projectId,
        version: outline.version,
        content: parseOutlineContent(outline.content),
        isActive: outline.isActive,
        createdAt: outline.createdAt,
        lessons: outline.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          orderIndex: lesson.orderIndex,
          objective: parseJsonField<string[]>(lesson.objective, []),
          content: lesson.content,
          estimatedMinutes: lesson.estimatedMinutes,
        })),
        project: {
          id: outline.project.id,
          title: outline.project.title,
          profile: outline.project.profile
            ? {
                ...outline.project.profile,
                preferences: outline.project.profile.preferences
                  ? JSON.parse(outline.project.profile.preferences)
                  : null,
              }
            : null,
        },
      },
    });
  } catch (error) {
    console.error("获取大纲错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取大纲失败" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { chapters } = body;

    if (!chapters || !Array.isArray(chapters)) {
      return NextResponse.json({ error: "缺少章节内容" }, { status: 400 });
    }

    const validatedChapters: OutlineChapter[] = chapters.map((chapter, index) => ({
      title: chapter.title || `第 ${index + 1} 章`,
      description: chapter.description || "",
      estimatedMinutes: chapter.estimatedMinutes || 30,
      difficulty: chapter.difficulty || "medium",
      orderIndex: index,
    }));

    const outline = await prisma.outline.update({
      where: { id },
      data: {
        content: JSON.stringify(validatedChapters),
      },
    });

    return NextResponse.json({
      success: true,
      outline: {
        id: outline.id,
        projectId: outline.projectId,
        version: outline.version,
        content: parseOutlineContent(outline.content),
        isActive: outline.isActive,
        createdAt: outline.createdAt,
      },
    });
  } catch (error) {
    console.error("更新大纲错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新大纲失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const outline = await prisma.outline.findUnique({
      where: { id },
    });

    if (!outline) {
      return NextResponse.json({ error: "大纲不存在" }, { status: 404 });
    }

    await prisma.outline.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "大纲已删除",
    });
  } catch (error) {
    console.error("删除大纲错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除大纲失败" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const outline = await prisma.outline.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
      },
    });

    if (!outline) {
      return NextResponse.json({ error: "大纲不存在" }, { status: 404 });
    }

    const deleted = await prisma.lesson.deleteMany({
      where: { outlineId: id },
    });

    await prisma.learningProject.update({
      where: { id: outline.projectId },
      data: { currentLessonId: null },
    });

    return NextResponse.json({
      success: true,
      outlineId: id,
      deletedLessonCount: deleted.count,
    });
  } catch (error) {
    console.error("Error deleting course lessons:", error);
    return NextResponse.json({ error: "删除课程失败" }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_USER_ID = "default-user";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "缺少 projectId 参数" },
        { status: 400 }
      );
    }

    const project = await prisma.learningProject.findUnique({
      where: { id: projectId },
      include: {
        outlines: {
          where: { isActive: true },
          orderBy: { version: "desc" },
          include: {
            lessons: {
              select: { id: true },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    const activeOutline = project.outlines[0];
    const totalLessons = activeOutline?.lessons.length || 0;
    const lessonIds = activeOutline?.lessons.map((lesson) => lesson.id) || [];

    const completedRecords = await prisma.studyRecord.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        lessonId: { in: lessonIds },
        status: "completed",
      },
    });

    const allRecords = await prisma.studyRecord.findMany({
      where: {
        userId: DEFAULT_USER_ID,
        lessonId: { in: lessonIds },
      },
    });

    const completedLessons = completedRecords.length;
    const totalStudyTime = allRecords.reduce((sum, record) => sum + record.studyTime, 0);
    const completionRate =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const completedLessonIds = new Set(completedRecords.map((record) => record.lessonId));

    let currentLessonId = project.currentLessonId;
    if (currentLessonId && !lessonIds.includes(currentLessonId)) {
      currentLessonId = null;
      await prisma.learningProject.update({
        where: { id: projectId },
        data: { currentLessonId: null },
      });
    }

    const resumeLessonId =
      currentLessonId ??
      activeOutline?.lessons.find((lesson) => !completedLessonIds.has(lesson.id))?.id ??
      activeOutline?.lessons[0]?.id ??
      null;

    return NextResponse.json({
      projectId,
      totalLessons,
      completedLessons,
      completionRate,
      totalStudyTime,
      currentLessonId: resumeLessonId,
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "获取学习进度失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lessonId, status, studyTime, projectId } = body;

    if (!lessonId) {
      return NextResponse.json(
        { error: "缺少 lessonId 参数" },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        outline: {
          select: { id: true, projectId: true },
        },
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "章节不存在" }, { status: 404 });
    }

    if (projectId) {
      const project = await prisma.learningProject.findUnique({
        where: { id: projectId },
        select: { id: true },
      });

      if (!project) {
        return NextResponse.json({ error: "项目不存在" }, { status: 404 });
      }

      if (lesson.outline.projectId !== projectId) {
        return NextResponse.json(
          { error: "该章节不属于当前项目" },
          { status: 400 }
        );
      }
    }

    const existingRecord = await prisma.studyRecord.findUnique({
      where: {
        userId_lessonId: {
          userId: DEFAULT_USER_ID,
          lessonId,
        },
      },
    });

    let record;
    if (existingRecord) {
      const newStudyTime = studyTime
        ? existingRecord.studyTime + studyTime
        : existingRecord.studyTime;

      record = await prisma.studyRecord.update({
        where: { id: existingRecord.id },
        data: {
          status: status || existingRecord.status,
          studyTime: newStudyTime,
          completedAt: status === "completed" ? new Date() : existingRecord.completedAt,
        },
      });
    } else {
      record = await prisma.studyRecord.create({
        data: {
          userId: DEFAULT_USER_ID,
          lessonId,
          status: status || "in_progress",
          studyTime: studyTime || 0,
          completedAt: status === "completed" ? new Date() : null,
        },
      });
    }

    if (projectId) {
      if (status === "completed") {
        const orderedLessons = await prisma.lesson.findMany({
          where: { outlineId: lesson.outlineId },
          select: { id: true },
          orderBy: { orderIndex: "asc" },
        });
        const currentLessonIndex = orderedLessons.findIndex((item) => item.id === lessonId);
        const nextLessonId =
          currentLessonIndex >= 0 ? orderedLessons[currentLessonIndex + 1]?.id ?? null : null;

        await prisma.learningProject.update({
          where: { id: projectId },
          data: { currentLessonId: nextLessonId },
        });
      } else if (status === "in_progress") {
        await prisma.learningProject.update({
          where: { id: projectId },
          data: { currentLessonId: lessonId },
        });
      }
    }

    return NextResponse.json({
      success: true,
      record: {
        id: record.id,
        lessonId: record.lessonId,
        status: record.status,
        studyTime: record.studyTime,
        completedAt: record.completedAt,
      },
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "更新学习进度失败" },
      { status: 500 }
    );
  }
}

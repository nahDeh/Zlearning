import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const projects = await prisma.learningProject.findMany({
      include: {
        profile: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        currentLessonId: p.currentLessonId,
        createdAt: p.createdAt,
        profile: p.profile
          ? {
              topic: p.profile.topic,
              goal: p.profile.goal,
              currentLevel: p.profile.currentLevel,
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "获取项目列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, profile } = body;

    if (!title || !profile) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const tempUserId = "temp-user-" + Date.now();

    const project = await prisma.learningProject.create({
      data: {
        userId: tempUserId,
        title,
        status: "active",
        profile: {
          create: {
            topic: profile.topic,
            goal: profile.goal,
            currentLevel: profile.currentLevel,
            timeBudget: profile.timeBudget,
            learningStyle: profile.learningStyle,
            preferences: {
              background: profile.background,
              preferences: profile.preferences,
            },
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return NextResponse.json({
      success: true,
      projectId: project.id,
      project,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "创建项目失败" },
      { status: 500 }
    );
  }
}

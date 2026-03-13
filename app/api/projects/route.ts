import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

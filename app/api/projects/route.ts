import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_USER_ID = "default-user";

async function ensureDefaultUser() {
  let user = await prisma.user.findUnique({
    where: { id: DEFAULT_USER_ID },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: DEFAULT_USER_ID,
        username: "default",
      },
    });
  }

  return user;
}

export async function GET() {
  try {
    await ensureDefaultUser();

    const projects = await prisma.learningProject.findMany({
      where: {
        userId: DEFAULT_USER_ID,
      },
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
        ...p,
        profile: p.profile
          ? {
              ...p.profile,
              preferences: p.profile.preferences
                ? JSON.parse(p.profile.preferences)
                : null,
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
    await ensureDefaultUser();

    const body = await request.json();

    // 支持两种格式：
    // 1. 扁平格式: { title, topic, goal, currentLevel, timeBudget, ... }
    // 2. 嵌套格式: { title, profile: { topic, goal, currentLevel, timeBudget, ... } }
    const profileData = body.profile || body;
    const title = body.title || profileData.topic;
    const { topic, goal, currentLevel, timeBudget, learningStyle, background, preferences } = profileData;

    if (!topic || !goal || !currentLevel || timeBudget === undefined) {
      console.error("Missing required fields:", { topic, goal, currentLevel, timeBudget });
      return NextResponse.json(
        { error: "缺少必要字段", required: ["topic", "goal", "currentLevel", "timeBudget"] },
        { status: 400 }
      );
    }

    const project = await prisma.learningProject.create({
      data: {
        userId: DEFAULT_USER_ID,
        title,
        profile: {
          create: {
            topic,
            goal,
            currentLevel,
            timeBudget: Number(timeBudget),
            learningStyle: learningStyle || "mixed",
            preferences: JSON.stringify({
              background: background || "",
              preferences: preferences || [],
            }),
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
      project: {
        ...project,
        profile: project.profile
          ? {
              ...project.profile,
              preferences: project.profile.preferences
                ? JSON.parse(project.profile.preferences)
                : null,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "创建项目失败" },
      { status: 500 }
    );
  }
}

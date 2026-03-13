import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.learningProject.findUnique({
      where: { id },
      include: {
        profile: true,
        materials: {
          select: {
            id: true,
            filename: true,
            fileType: true,
            parseStatus: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
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
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "获取项目失败" },
      { status: 500 }
    );
  }
}

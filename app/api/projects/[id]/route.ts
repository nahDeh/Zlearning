import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

function deleteFileIfExists(filePath: string | null) {
  if (!filePath) return;

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn("Failed to delete file:", filePath, error);
  }
}

function deleteProjectUploads(projectId: string, filePaths: Array<string | null>) {
  for (const filePath of filePaths) {
    deleteFileIfExists(filePath);
  }

  const projectDir = path.join(UPLOAD_DIR, projectId);
  try {
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn("Failed to delete project upload directory:", projectDir, error);
  }
}

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.learningProject.findUnique({
      where: { id },
      include: {
        materials: {
          select: {
            filePath: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    const filePaths = project.materials.map((material) => material.filePath);

    await prisma.learningProject.delete({
      where: { id },
    });

    deleteProjectUploads(id, filePaths);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "删除项目失败" }, { status: 500 });
  }
}

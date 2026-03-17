import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function deleteFileIfExists(filePath: string | null) {
  if (!filePath) return;

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn("Failed to delete material file:", filePath, error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const material = await prisma.material.findUnique({
      where: { id },
      select: {
        id: true,
        filePath: true,
        projectId: true,
      },
    });

    if (!material) {
      return NextResponse.json({ error: "资料不存在" }, { status: 404 });
    }

    await prisma.material.delete({
      where: { id },
    });

    deleteFileIfExists(material.filePath);

    const projectDir = path.join(process.cwd(), "uploads", material.projectId);
    try {
      if (fs.existsSync(projectDir) && fs.readdirSync(projectDir).length === 0) {
        fs.rmdirSync(projectDir);
      }
    } catch (error) {
      console.warn("Failed to cleanup project upload directory:", projectDir, error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json({ error: "删除资料失败" }, { status: 500 });
  }
}


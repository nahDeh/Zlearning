import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseMaterialMetadata } from "@/services/materials";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "缂哄皯 projectId 鍙傛暟" }, { status: 400 });
    }

    const materials = await prisma.material.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      materials: materials.map((material) => {
        const metadata = parseMaterialMetadata(material.metadata);

        return {
          id: material.id,
          filename: material.filename,
          fileType: material.fileType,
          fileSize: material.fileSize,
          parseStatus: material.parseStatus,
          chunkCount: material._count.chunks,
          createdAt: material.createdAt,
          errorMessage: metadata?.error || null,
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json({ error: "鑾峰彇璧勬枡鍒楄〃澶辫触" }, { status: 500 });
  }
}


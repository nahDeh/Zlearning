import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  parseFile,
  getFileType,
  isValidFileType,
  type SupportedFileType,
} from "@/services/parser";
import { splitTextIntoChunks, mergeSmallChunks } from "@/services/chunker";
import {
  parseMaterialMetadata,
  serializeMaterialMetadata,
  type MaterialMetadata,
} from "@/services/materials";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export const runtime = "nodejs";

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function deleteFileIfExists(filePath: string | null) {
  if (!filePath) {
    return;
  }

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn("Failed to clean up uploaded file:", filePath, error);
  }
}

function buildFailureMetadata(
  errorMessage: string,
  metadata?: MaterialMetadata
): MaterialMetadata {
  return {
    ...metadata,
    error: errorMessage,
  };
}

async function markMaterialFailed(materialId: string, errorMessage: string) {
  await prisma.material.update({
    where: { id: materialId },
    data: {
      parseStatus: "failed",
      metadata: serializeMaterialMetadata(buildFailureMetadata(errorMessage)),
    },
  });
}

export async function POST(request: NextRequest) {
  let uploadedFilePath: string | null = null;
  let materialId: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "未提供文件" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "未提供项目 ID" }, { status: 400 });
    }

    if (!isValidFileType(file.name)) {
      return NextResponse.json(
        { error: "不支持的文件类型，仅支持 txt、md、pdf、epub 格式" },
        { status: 400 }
      );
    }

    const project = await prisma.learningProject.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    ensureDir(UPLOAD_DIR);

    const projectDir = path.join(UPLOAD_DIR, projectId);
    ensureDir(projectDir);

    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, "_");
    const uniqueFilename = `${timestamp}_${safeFilename}`;
    uploadedFilePath = path.join(projectDir, uniqueFilename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(uploadedFilePath, buffer);

    const fileType = (getFileType(file.name) ?? "txt") as SupportedFileType;

    const material = await prisma.material.create({
      data: {
        projectId,
        filename: file.name,
        fileType,
        filePath: uploadedFilePath,
        fileSize: file.size,
        parseStatus: "pending",
      },
    });

    materialId = material.id;

    const parseResult = await parseFile(uploadedFilePath, fileType);
    const extractedText = parseResult.text.trim();

    if (!parseResult.success || !extractedText) {
      const errorMessage =
        parseResult.success && !extractedText
          ? "未能从文件中提取出可用文本"
          : parseResult.error || "文件解析失败";

      const failureMetadata = buildFailureMetadata(
        errorMessage,
        parseResult.metadata
      );

      await prisma.material.update({
        where: { id: material.id },
        data: {
          parseStatus: "failed",
          extractedText: null,
          metadata: serializeMaterialMetadata(failureMetadata),
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          materialId: material.id,
        },
        { status: 422 }
      );
    }

    const chunks = splitTextIntoChunks(extractedText, {
      maxChunkSize: 1000,
      overlapSize: 100,
    });
    const mergedChunks = mergeSmallChunks(chunks, 200);
    const metadata = parseResult.metadata ?? {
      wordCount: 0,
      charCount: 0,
    };

    const completedMaterial = await prisma.$transaction(async (tx) => {
      await tx.material.update({
        where: { id: material.id },
        data: {
          parseStatus: "processing",
          extractedText,
          metadata: serializeMaterialMetadata(metadata),
        },
      });

      if (mergedChunks.length > 0) {
        await tx.materialChunk.createMany({
          data: mergedChunks.map((chunk, index) => ({
            materialId: material.id,
            chunkText: chunk.text,
            chunkIndex: index,
            metadata: JSON.stringify({
              startIndex: chunk.startIndex,
              endIndex: chunk.endIndex,
            }),
          })),
        });
      }

      return tx.material.update({
        where: { id: material.id },
        data: {
          parseStatus: "completed",
        },
      });
    });

    return NextResponse.json({
      success: true,
      material: {
        id: completedMaterial.id,
        filename: completedMaterial.filename,
        fileType: completedMaterial.fileType,
        fileSize: completedMaterial.fileSize,
        parseStatus: completedMaterial.parseStatus,
        metadata,
        chunkCount: mergedChunks.length,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "上传处理失败";

    if (materialId) {
      try {
        await markMaterialFailed(materialId, errorMessage);
      } catch (updateError) {
        console.error("Failed to mark material upload as failed:", updateError);
      }
    } else {
      deleteFileIfExists(uploadedFilePath);
    }

    console.error("上传处理错误:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "未提供项目 ID" }, { status: 400 });
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
    console.error("获取资料列表错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取资料列表失败" },
      { status: 500 }
    );
  }
}

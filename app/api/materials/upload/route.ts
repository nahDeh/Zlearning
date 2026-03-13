import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { parseFile, getFileType, isValidFileType } from "@/services/parser";
import { splitTextIntoChunks, mergeSmallChunks } from "@/services/chunker";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "未提供文件" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "未提供项目ID" }, { status: 400 });
    }

    if (!isValidFileType(file.name)) {
      return NextResponse.json(
        { error: "不支持的文件类型，仅支持 txt、md、pdf 格式" },
        { status: 400 }
      );
    }

    const project = await prisma.learningProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    ensureUploadDir();

    const projectDir = path.join(UPLOAD_DIR, projectId);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }

    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5._-]/g, "_");
    const uniqueFilename = `${timestamp}_${safeFilename}`;
    const filePath = path.join(projectDir, uniqueFilename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    const fileType = getFileType(file.name);
    const material = await prisma.material.create({
      data: {
        projectId,
        filename: file.name,
        fileType: fileType || "txt",
        filePath,
        fileSize: file.size,
        parseStatus: "pending",
      },
    });

    const parseResult = await parseFile(filePath, fileType as "txt" | "md" | "pdf");

    if (!parseResult.success) {
      await prisma.material.update({
        where: { id: material.id },
        data: {
          parseStatus: "failed",
          metadata: JSON.stringify({ error: parseResult.error }),
        },
      });

      return NextResponse.json({
        success: false,
        error: parseResult.error,
        materialId: material.id,
      });
    }

    await prisma.material.update({
      where: { id: material.id },
      data: {
        parseStatus: "processing",
        extractedText: parseResult.text,
        metadata: JSON.stringify(parseResult.metadata),
      },
    });

    const chunks = splitTextIntoChunks(parseResult.text, {
      maxChunkSize: 1000,
      overlapSize: 100,
    });
    const mergedChunks = mergeSmallChunks(chunks, 200);

    await prisma.materialChunk.createMany({
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

    await prisma.material.update({
      where: { id: material.id },
      data: {
        parseStatus: "completed",
      },
    });

    return NextResponse.json({
      success: true,
      material: {
        id: material.id,
        filename: material.filename,
        fileType: material.fileType,
        fileSize: material.fileSize,
        parseStatus: "completed",
        metadata: parseResult.metadata,
        chunkCount: mergedChunks.length,
      },
    });
  } catch (error) {
    console.error("上传处理错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "上传处理失败" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "未提供项目ID" }, { status: 400 });
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
      materials: materials.map((m) => ({
        id: m.id,
        filename: m.filename,
        fileType: m.fileType,
        fileSize: m.fileSize,
        parseStatus: m.parseStatus,
        chunkCount: m._count.chunks,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error("获取资料列表错误:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取资料列表失败" },
      { status: 500 }
    );
  }
}

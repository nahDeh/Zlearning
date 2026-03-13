import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseMaterialMetadata } from "@/services/materials";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  FileText,
  HardDrive,
  Hash,
  Layers,
} from "lucide-react";

interface MaterialDetailPageProps {
  params: {
    id: string;
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getStatusBadge(status: string) {
  const statusConfig: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    pending: { label: "等待处理", variant: "secondary" },
    processing: { label: "处理中", variant: "default" },
    completed: { label: "已完成", variant: "outline" },
    failed: { label: "失败", variant: "destructive" },
  };

  const config = statusConfig[status] || {
    label: status,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default async function MaterialDetailPage({
  params,
}: MaterialDetailPageProps) {
  const material = await prisma.material.findUnique({
    where: { id: params.id },
    include: {
      chunks: {
        orderBy: { chunkIndex: "asc" },
      },
      project: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!material) {
    notFound();
  }

  const metadata = parseMaterialMetadata(material.metadata);
  const parseError = metadata?.error || null;
  const statLabel = metadata?.pageCount ? "页数" : "平均块大小";
  const statValue = metadata?.pageCount
    ? metadata.pageCount.toLocaleString()
    : material.chunks.length > 0
      ? Math.round(
          material.chunks.reduce((sum, chunk) => sum + chunk.chunkText.length, 0) /
            material.chunks.length
        ).toLocaleString()
      : "-";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20 py-6">
      <div className="container mx-auto space-y-6 px-4">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${material.projectId}`}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-cyan-50 hover:text-cyan-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {material.filename}
            </h1>
            <p className="text-slate-500">项目: {material.project.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Card className="glass rounded-2xl shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-cyan-600">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100">
                  <FileText className="h-4 w-4" />
                </div>
                文件类型
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold uppercase text-slate-800">
                {material.fileType}
              </p>
            </CardContent>
          </Card>

          <Card className="glass rounded-2xl shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-cyan-600">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100">
                  <HardDrive className="h-4 w-4" />
                </div>
                文件大小
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-800">
                {formatFileSize(material.fileSize)}
              </p>
            </CardContent>
          </Card>

          <Card className="glass rounded-2xl shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-cyan-600">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100">
                  <Calendar className="h-4 w-4" />
                </div>
                上传时间
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-slate-800">
                {formatDate(material.createdAt)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-slate-800">
              <span className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100">
                  <FileText className="h-4 w-4 text-cyan-600" />
                </div>
                解析状态
              </span>
              {getStatusBadge(material.parseStatus)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {parseError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {parseError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="space-y-2 rounded-xl border border-cyan-100 bg-cyan-50/50 p-4">
                <p className="text-sm text-slate-500">字符数</p>
                <p className="text-xl font-bold text-cyan-600">
                  {metadata?.charCount?.toLocaleString() || "-"}
                </p>
              </div>
              <div className="space-y-2 rounded-xl border border-cyan-100 bg-cyan-50/50 p-4">
                <p className="text-sm text-slate-500">词数</p>
                <p className="text-xl font-bold text-cyan-600">
                  {metadata?.wordCount?.toLocaleString() || "-"}
                </p>
              </div>
              <div className="space-y-2 rounded-xl border border-cyan-100 bg-cyan-50/50 p-4">
                <p className="text-sm text-slate-500">分块数量</p>
                <p className="text-xl font-bold text-cyan-600">
                  {material.chunks.length}
                </p>
              </div>
              <div className="space-y-2 rounded-xl border border-cyan-100 bg-cyan-50/50 p-4">
                <p className="text-sm text-slate-500">{statLabel}</p>
                <p className="text-xl font-bold text-cyan-600">{statValue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {material.extractedText && (
          <Card className="glass rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100">
                  <FileText className="h-4 w-4 text-cyan-600" />
                </div>
                提取文本预览
              </CardTitle>
              <CardDescription className="text-slate-500">
                显示前 2000 个字符
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700">
                  {material.extractedText.slice(0, 2000)}
                  {material.extractedText.length > 2000 && (
                    <span className="text-slate-400">...</span>
                  )}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {material.chunks.length > 0 && (
          <Card className="glass rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100">
                  <Layers className="h-4 w-4 text-cyan-600" />
                </div>
                文本分块
              </CardTitle>
              <CardDescription className="text-slate-500">
                共 {material.chunks.length} 个分块
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[600px] space-y-4 overflow-y-auto">
                {material.chunks.slice(0, 20).map((chunk) => (
                  <div
                    key={chunk.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-cyan-100">
                        <Hash className="h-3 w-3 text-cyan-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        分块 {chunk.chunkIndex + 1}
                      </span>
                      <Badge className="ml-auto border-0 bg-cyan-100 text-cyan-700 hover:bg-cyan-100">
                        {chunk.chunkText.length} 字符
                      </Badge>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-white p-3">
                      <p className="line-clamp-4 whitespace-pre-wrap text-sm text-slate-600">
                        {chunk.chunkText}
                      </p>
                    </div>
                  </div>
                ))}
                {material.chunks.length > 20 && (
                  <p className="py-4 text-center text-sm text-slate-500">
                    还有 {material.chunks.length - 20} 个分块未显示...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

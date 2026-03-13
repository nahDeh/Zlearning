import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, HardDrive, Layers, Hash, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: { label: "待处理", variant: "secondary" },
    processing: { label: "处理中", variant: "default" },
    completed: { label: "已完成", variant: "outline" },
    failed: { label: "失败", variant: "destructive" },
  };

  const config = statusConfig[status] || { label: status, variant: "secondary" };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default async function MaterialDetailPage({ params }: MaterialDetailPageProps) {
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

  const metadata = material.metadata as {
    wordCount?: number;
    charCount?: number;
    pageCount?: number;
  } | null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/projects/${material.projectId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{material.filename}</h1>
          <p className="text-muted-foreground">项目: {material.project.title}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              文件类型
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold uppercase">{material.fileType}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              文件大小
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatFileSize(material.fileSize)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              上传时间
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{formatDate(material.createdAt)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>解析状态</span>
            {getStatusBadge(material.parseStatus)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">字符数</p>
              <p className="text-xl font-semibold">
                {metadata?.charCount?.toLocaleString() || "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">词数</p>
              <p className="text-xl font-semibold">
                {metadata?.wordCount?.toLocaleString() || "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">分块数量</p>
              <p className="text-xl font-semibold">{material.chunks.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">平均块大小</p>
              <p className="text-xl font-semibold">
                {material.chunks.length > 0
                  ? Math.round(
                      material.chunks.reduce((sum, c) => sum + c.chunkText.length, 0) /
                        material.chunks.length
                    )
                  : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {material.extractedText && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              提取文本预览
            </CardTitle>
            <CardDescription>
              显示前 2000 个字符
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {material.extractedText.slice(0, 2000)}
                {material.extractedText.length > 2000 && (
                  <span className="text-muted-foreground">...</span>
                )}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {material.chunks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              文本分块
            </CardTitle>
            <CardDescription>
              共 {material.chunks.length} 个分块
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {material.chunks.slice(0, 20).map((chunk, index) => (
                <div key={chunk.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">分块 {chunk.chunkIndex + 1}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {chunk.chunkText.length} 字符
                    </Badge>
                  </div>
                  <div className="bg-muted rounded p-3">
                    <p className="text-sm whitespace-pre-wrap line-clamp-4">
                      {chunk.chunkText}
                    </p>
                  </div>
                </div>
              ))}
              {material.chunks.length > 20 && (
                <p className="text-center text-muted-foreground text-sm">
                  还有 {material.chunks.length - 20} 个分块未显示...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

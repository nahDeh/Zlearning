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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20 py-6">
      <div className="container mx-auto px-4 space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${material.projectId}`}>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-cyan-50 hover:text-cyan-600">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{material.filename}</h1>
            <p className="text-slate-500">项目: {material.project.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="glass rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-cyan-600">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
                文件类型
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-800 uppercase">{material.fileType}</p>
            </CardContent>
          </Card>

          <Card className="glass rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-cyan-600">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <HardDrive className="h-4 w-4" />
                </div>
                文件大小
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-800">{formatFileSize(material.fileSize)}</p>
            </CardContent>
          </Card>

          <Card className="glass rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2 text-cyan-600">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4" />
                </div>
                上传时间
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-slate-800">{formatDate(material.createdAt)}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-slate-800">
              <span className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-cyan-600" />
                </div>
                解析状态
              </span>
              {getStatusBadge(material.parseStatus)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2 p-4 bg-cyan-50/50 rounded-xl border border-cyan-100">
                <p className="text-sm text-slate-500">字符数</p>
                <p className="text-xl font-bold text-cyan-600">
                  {metadata?.charCount?.toLocaleString() || "-"}
                </p>
              </div>
              <div className="space-y-2 p-4 bg-cyan-50/50 rounded-xl border border-cyan-100">
                <p className="text-sm text-slate-500">词数</p>
                <p className="text-xl font-bold text-cyan-600">
                  {metadata?.wordCount?.toLocaleString() || "-"}
                </p>
              </div>
              <div className="space-y-2 p-4 bg-cyan-50/50 rounded-xl border border-cyan-100">
                <p className="text-sm text-slate-500">分块数量</p>
                <p className="text-xl font-bold text-cyan-600">{material.chunks.length}</p>
              </div>
              <div className="space-y-2 p-4 bg-cyan-50/50 rounded-xl border border-cyan-100">
                <p className="text-sm text-slate-500">平均块大小</p>
                <p className="text-xl font-bold text-cyan-600">
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
          <Card className="glass rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-cyan-600" />
                </div>
                提取文本预览
              </CardTitle>
              <CardDescription className="text-slate-500">
                显示前 2000 个字符
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 rounded-xl p-4 max-h-96 overflow-y-auto border border-slate-200">
                <pre className="text-sm whitespace-pre-wrap font-mono text-slate-700">
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
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-cyan-600" />
                </div>
                文本分块
              </CardTitle>
              <CardDescription className="text-slate-500">
                共 {material.chunks.length} 个分块
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {material.chunks.slice(0, 20).map((chunk, index) => (
                  <div key={chunk.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded bg-cyan-100 flex items-center justify-center">
                        <Hash className="h-3 w-3 text-cyan-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">分块 {chunk.chunkIndex + 1}</span>
                      <Badge className="ml-auto bg-cyan-100 text-cyan-700 hover:bg-cyan-100 border-0">
                        {chunk.chunkText.length} 字符
                      </Badge>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-100">
                      <p className="text-sm whitespace-pre-wrap line-clamp-4 text-slate-600">
                        {chunk.chunkText}
                      </p>
                    </div>
                  </div>
                ))}
                {material.chunks.length > 20 && (
                  <p className="text-center text-slate-500 text-sm py-4">
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

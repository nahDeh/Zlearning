"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
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
  FileUpload,
  type UploadedMaterial,
} from "@/components/upload/FileUpload";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  FileText,
  Loader2,
  Target,
  Upload,
  User,
} from "lucide-react";

interface ProjectData {
  id: string;
  title: string;
  status: string;
  profile?: {
    topic: string;
    goal: string;
    currentLevel: string;
    timeBudget: number;
    learningStyle: string;
    preferences?: {
      background?: string;
      preferences?: string[];
    } | null;
  } | null;
}

interface MaterialListItem {
  id: string;
  filename: string;
  fileType: string;
  parseStatus: string;
  chunkCount: number;
  errorMessage?: string | null;
}

interface GenerateOutlineResponse {
  success?: boolean;
  outline?: {
    id: string;
  };
  error?: string;
}

const levelLabels: Record<string, string> = {
  beginner: "零基础入门",
  intermediate: "有一定基础",
  advanced: "进阶学习",
};

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "等待处理", variant: "secondary" },
  processing: { label: "解析中", variant: "default" },
  completed: { label: "已解析", variant: "outline" },
  failed: { label: "解析失败", variant: "destructive" },
};

function getStatusBadge(status: string) {
  const config = statusConfig[status] || {
    label: status,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = React.useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [materials, setMaterials] = React.useState<MaterialListItem[]>([]);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [outlineError, setOutlineError] = React.useState<string | null>(null);
  const [outlineLoadingId, setOutlineLoadingId] = React.useState<string | null>(
    null
  );

  const fetchProject = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      }
    } catch (error) {
      console.error("Failed to fetch project:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const fetchMaterials = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/materials/upload?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    }
  }, [projectId]);

  React.useEffect(() => {
    void fetchProject();
    void fetchMaterials();
  }, [fetchMaterials, fetchProject]);

  function handleUploadSuccess(_material: UploadedMaterial) {
    setUploadError(null);
    setOutlineError(null);
    void fetchMaterials();
  }

  function handleUploadError(error: string) {
    setUploadError(error);
    void fetchMaterials();
  }

  const generateOutline = React.useCallback(
    async (materialId: string) => {
      try {
        setOutlineLoadingId(materialId);
        setOutlineError(null);

        const response = await fetch(`/api/materials/${materialId}/outline`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ regenerate: false }),
        });
        const data = (await response.json()) as GenerateOutlineResponse;

        if (!response.ok || !data.success || !data.outline?.id) {
          throw new Error(data.error || "生成大纲失败");
        }

        router.push(`/outlines/${data.outline.id}`);
      } catch (error) {
        setOutlineError(
          error instanceof Error ? error.message : "生成大纲失败，请稍后重试"
        );
      } finally {
        setOutlineLoadingId(null);
      }
    },
    [router]
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="mb-4 text-muted-foreground">项目不存在</p>
            <Button onClick={() => router.push("/learn")}>返回学习中心</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasMaterials = materials.length > 0;
  const latestCompletedMaterial =
    materials.find((material) => material.parseStatus === "completed") || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/learn")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{project.title}</h1>
              <p className="text-sm text-muted-foreground">学习项目</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">学习画像</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.profile && (
                  <>
                    <div className="flex items-start gap-3">
                      <BookOpen className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">学习主题</p>
                        <p className="font-medium">{project.profile.topic}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Target className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">学习目标</p>
                        <p className="text-sm font-medium">{project.profile.goal}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">当前水平</p>
                        <Badge variant="secondary">
                          {levelLabels[project.profile.currentLevel] ||
                            project.profile.currentLevel}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">每周学习时间</p>
                        <p className="font-medium">约 {project.profile.timeBudget} 小时</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="h-5 w-5" />
                  上传学习资料
                </CardTitle>
                <CardDescription>
                  上传 TXT、MD、PDF 或 EPUB 文件，系统会自动解析内容并生成后续学习资料。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadError && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    {uploadError}
                  </div>
                )}

                <FileUpload
                  projectId={projectId}
                  onUploadComplete={handleUploadSuccess}
                  onUploadError={handleUploadError}
                />
              </CardContent>
            </Card>

            {hasMaterials && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    已上传资料
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {outlineError && (
                    <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                      {outlineError}
                    </div>
                  )}

                  {latestCompletedMaterial && (
                    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-800">
                          下一步：生成课程大纲
                        </p>
                        <p className="text-xs text-slate-500">
                          将基于最新解析完成的资料生成（或打开已生成的）学习大纲
                        </p>
                      </div>
                      <Button
                        onClick={() =>
                          void generateOutline(latestCompletedMaterial.id)
                        }
                        disabled={outlineLoadingId !== null}
                        className="rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-md shadow-cyan-200/50 hover:from-cyan-600 hover:to-cyan-700"
                      >
                        {outlineLoadingId === latestCompletedMaterial.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            生成中..
                          </>
                        ) : (
                          "生成/查看大纲"
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {materials.map((material) => (
                      <div
                        key={material.id}
                        className="cursor-pointer rounded-xl border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-primary/30"
                        onClick={() => router.push(`/materials/${material.id}`)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <FileText className="mt-0.5 h-5 w-5 text-primary" />
                            <div className="space-y-1">
                              <p className="font-medium">{material.filename}</p>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span className="uppercase">{material.fileType}</span>
                                <span>· {material.chunkCount} 个分块</span>
                                {getStatusBadge(material.parseStatus)}
                              </div>
                              {material.errorMessage && (
                                <p className="text-sm text-destructive">
                                  {material.errorMessage}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {material.parseStatus === "completed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={outlineLoadingId !== null}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void generateOutline(material.id);
                                }}
                                className="rounded-full"
                              >
                                {outlineLoadingId === material.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "大纲"
                                )}
                              </Button>
                            )}
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

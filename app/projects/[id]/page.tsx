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
import type { RecommendedBook } from "@/services/ai";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  Target,
  Upload,
  User,
} from "lucide-react";

interface ProjectData {
  id: string;
  title: string;
  status: string;
  activeOutline?: {
    id: string;
    version: number;
    createdAt: string;
    lessonCount: number;
  } | null;
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

function coerceRecommendedBooks(input: unknown): RecommendedBook[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const record = item as Record<string, unknown>;
      const levelRaw = record.level;
      const level =
        levelRaw === "入门" || levelRaw === "进阶" || levelRaw === "高级"
          ? levelRaw
          : "入门";

      return {
        title: typeof record.title === "string" ? record.title : "",
        author: typeof record.author === "string" ? record.author : "",
        description:
          typeof record.description === "string" ? record.description : "",
        level,
        reason: typeof record.reason === "string" ? record.reason : "",
      } as RecommendedBook;
    })
    .filter((book) => Boolean(book.title));
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
  const [deletingMaterialId, setDeletingMaterialId] = React.useState<
    string | null
  >(null);
  const [deleteMaterialError, setDeleteMaterialError] = React.useState<
    string | null
  >(null);
  const [recommendedBooks, setRecommendedBooks] = React.useState<
    RecommendedBook[]
  >([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    React.useState(true);
  const [recommendationsError, setRecommendationsError] = React.useState<
    string | null
  >(null);
  const [isGeneratingCourse, setIsGeneratingCourse] = React.useState(false);
  const [courseActionError, setCourseActionError] = React.useState<string | null>(
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

  React.useEffect(() => {
    if (isLoading || !project) return;

    const storageKey = `recommendedBooks:${projectId}`;
    let cancelled = false;

    async function loadRecommendedBooks() {
      setIsLoadingRecommendations(true);
      setRecommendationsError(null);

      try {
        const cachedRaw = localStorage.getItem(storageKey);
        if (cachedRaw) {
          const cached = coerceRecommendedBooks(JSON.parse(cachedRaw));
          if (cached.length > 0) {
            if (!cancelled) {
              setRecommendedBooks(cached);
              setIsLoadingRecommendations(false);
            }
            return;
          }
        }
      } catch (error) {
        console.warn("Failed to read cached recommended books:", error);
      }

      if (!project || !project.profile) {
        if (!cancelled) {
          setRecommendedBooks([]);
          setIsLoadingRecommendations(false);
        }
        return;
      }

      try {
        const background = project.profile.preferences?.background ?? "";
        const response = await fetch("/api/recommendations/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: {
              topic: project.profile.topic,
              goal: project.profile.goal,
              currentLevel: project.profile.currentLevel,
              timeBudget: project.profile.timeBudget,
              learningStyle: project.profile.learningStyle,
              background,
            },
          }),
        });

        const data = (await response.json()) as {
          success?: boolean;
          books?: unknown;
          error?: string;
        };

        if (!response.ok || !data.success || !Array.isArray(data.books)) {
          throw new Error(data.error || "获取推荐资料失败");
        }

        const books = coerceRecommendedBooks(data.books);
        if (!cancelled) {
          setRecommendedBooks(books);
        }

        if (books.length > 0) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(books));
          } catch (error) {
            console.warn("Failed to persist recommended books:", error);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setRecommendedBooks([]);
          setRecommendationsError(
            error instanceof Error ? error.message : "获取推荐资料失败，请稍后重试"
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRecommendations(false);
        }
      }
    }

    void loadRecommendedBooks();

    return () => {
      cancelled = true;
    };
  }, [isLoading, project, projectId]);

  function handleUploadSuccess(_material: UploadedMaterial) {
    setUploadError(null);
    setOutlineError(null);
    void fetchMaterials();
  }

  function handleUploadError(error: string) {
    setUploadError(error);
    void fetchMaterials();
  }

  const deleteMaterial = React.useCallback(
    async (materialId: string) => {
      const confirmed = window.confirm("确定删除该资料吗？删除后无法恢复。");
      if (!confirmed) return;

      try {
        setDeletingMaterialId(materialId);
        setDeleteMaterialError(null);

        const response = await fetch(`/api/materials/${materialId}`, {
          method: "DELETE",
        });
        const data = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        };

        if (!response.ok || !data.success) {
          throw new Error(data.error || "删除资料失败");
        }

        void fetchMaterials();
      } catch (error) {
        setDeleteMaterialError(
          error instanceof Error ? error.message : "删除资料失败，请稍后重试"
        );
      } finally {
        setDeletingMaterialId(null);
      }
    },
    [fetchMaterials]
  );

  const generateOutline = React.useCallback(
    async (materialId: string, regenerate = false) => {
      if (regenerate) {
        const confirmed = window.confirm(
          "确定重新生成学习大纲吗？将创建新的大纲版本，可能需要重新生成课程内容。"
        );
        if (!confirmed) return;
      }

      try {
        setOutlineLoadingId(materialId);
        setOutlineError(null);
        setCourseActionError(null);

        const response = await fetch(`/api/materials/${materialId}/outline`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ regenerate }),
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

  const handleGenerateCourse = React.useCallback(async () => {
    const outlineId = project?.activeOutline?.id ?? null;
    const existingLessonCount = project?.activeOutline?.lessonCount ?? 0;

    if (!outlineId) {
      setCourseActionError("请先生成学习大纲");
      return;
    }

    const confirmed = window.confirm(
      existingLessonCount > 0
        ? "确定重新生成课程内容吗？将覆盖当前所有章节内容。"
        : "确定生成课程内容吗？生成后可进入课程编辑与学习。"
    );
    if (!confirmed) return;

    try {
      setIsGeneratingCourse(true);
      setCourseActionError(null);

      const response = await fetch("/api/courses/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outlineId }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "生成课程失败");
      }

      await fetchProject();
      router.push(`/courses/${outlineId}`);
    } catch (error) {
      setCourseActionError(
        error instanceof Error ? error.message : "生成课程失败，请稍后重试"
      );
    } finally {
      setIsGeneratingCourse(false);
    }
  }, [fetchProject, project?.activeOutline?.id, project?.activeOutline?.lessonCount, router]);

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
  const activeOutline = project.activeOutline ?? null;
  const hasOutline = Boolean(activeOutline?.id);
  const hasCourseContent = (activeOutline?.lessonCount ?? 0) > 0;

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
          <div className="space-y-6 lg:col-span-1">
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

            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5" />
                  AI 推荐资料
                </CardTitle>
                <CardDescription>上一步生成的推荐书籍</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingRecommendations ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    正在加载推荐资料...
                  </div>
                ) : recommendationsError ? (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    {recommendationsError}
                  </div>
                ) : recommendedBooks.length > 0 ? (
                  <div className="space-y-3">
                    {recommendedBooks.map((book, index) => (
                      <div
                        key={`${book.title}-${index}`}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {book.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {book.author}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="shrink-0 border-indigo-200 text-indigo-700"
                          >
                            {book.level}
                          </Badge>
                        </div>
                        {book.reason && (
                          <p className="mt-2 text-xs text-slate-600">
                            {book.reason}
                          </p>
                        )}
                      </div>
                    ))}

                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      提示：你可以优先上传这些书籍的 PDF 或 EPUB 文件，系统会自动解析并生成学习资料。
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    暂无推荐资料
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5" />
                  大纲与课程
                </CardTitle>
                <CardDescription>
                  在这里可以编辑学习大纲、课程内容、资料，并支持重新生成。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(outlineError || courseActionError) && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    {courseActionError || outlineError}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">学习大纲</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {hasOutline
                            ? `版本 ${activeOutline?.version}`
                            : "尚未生成大纲"}
                        </p>
                      </div>
                      {hasOutline && (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-slate-200 text-slate-600"
                        >
                          v{activeOutline?.version}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {hasOutline ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isGeneratingCourse || outlineLoadingId !== null}
                            onClick={() => router.push(`/outlines/${activeOutline?.id}`)}
                            className="rounded-full"
                          >
                            编辑大纲
                          </Button>
                          <Button
                            size="sm"
                            disabled={
                              outlineLoadingId !== null || !latestCompletedMaterial
                            }
                            onClick={() =>
                              latestCompletedMaterial
                                ? void generateOutline(latestCompletedMaterial.id, true)
                                : undefined
                            }
                            className="rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-200/50 hover:from-indigo-600 hover:to-indigo-700"
                          >
                            {outlineLoadingId === latestCompletedMaterial?.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="mr-2 h-4 w-4" />
                            )}
                            重新生成大纲
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          disabled={outlineLoadingId !== null || !latestCompletedMaterial}
                          onClick={() =>
                            latestCompletedMaterial
                              ? void generateOutline(latestCompletedMaterial.id)
                              : undefined
                          }
                          className="rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md shadow-cyan-200/50 hover:from-cyan-600 hover:to-cyan-700"
                        >
                          {outlineLoadingId === latestCompletedMaterial?.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                          )}
                          生成大纲
                        </Button>
                      )}
                    </div>

                    {!latestCompletedMaterial && (
                      <p className="mt-3 text-xs text-slate-500">
                        先上传并完成解析一份资料后，才能生成/重新生成大纲。
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">课程内容</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {!hasOutline
                            ? "请先生成学习大纲"
                            : hasCourseContent
                              ? `已生成 ${activeOutline?.lessonCount} 章`
                              : "尚未生成课程内容"}
                        </p>
                      </div>
                      {hasCourseContent && (
                        <Badge className="shrink-0 bg-green-100 text-green-700 hover:bg-green-100">
                          已生成
                        </Badge>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!hasOutline}
                        onClick={() => (hasOutline ? router.push(`/courses/${activeOutline?.id}`) : undefined)}
                        className="rounded-full"
                      >
                        编辑课程
                      </Button>
                      <Button
                        size="sm"
                        disabled={!hasOutline || isGeneratingCourse}
                        onClick={() => void handleGenerateCourse()}
                        className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-200/50 hover:from-emerald-600 hover:to-emerald-700"
                      >
                        {isGeneratingCourse ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        {hasCourseContent ? "重新生成课程" : "生成课程"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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

                  {deleteMaterialError && (
                    <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                      {deleteMaterialError}
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
                            <Button
                              size="icon"
                              variant="ghost"
                              aria-label="删除资料"
                              disabled={deletingMaterialId !== null || outlineLoadingId !== null}
                              onClick={(event) => {
                                event.stopPropagation();
                                void deleteMaterial(material.id);
                              }}
                              className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              {deletingMaterialId === material.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
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

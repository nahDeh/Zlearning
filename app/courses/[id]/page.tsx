"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  orderIndex: number;
  objective: string[];
  estimatedMinutes: number | null;
  content: string | null;
}

interface Chapter {
  title: string;
  description: string;
  orderIndex: number;
  difficulty: string;
  estimatedMinutes?: number;
}

interface OutlineData {
  id: string;
  projectId: string;
  version: number;
  content: Chapter[];
  lessons: Lesson[];
  project?: {
    id: string;
    title: string;
  } | null;
}

interface OutlineApiResponse {
  success: boolean;
  outline?: OutlineData;
  error?: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getOutlineData(outlineId: string): Promise<OutlineData | null> {
  const res = await fetch(`/api/outlines/${outlineId}`);
  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as OutlineApiResponse;
  if (!data.success || !data.outline) {
    return null;
  }

  return data.outline;
}

async function generateCourse(outlineId: string): Promise<{
  success: boolean;
  lessonCount?: number;
  error?: string;
}> {
  try {
    const res = await fetch("/api/courses/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outlineId }),
    });

    return (await res.json()) as {
      success: boolean;
      lessonCount?: number;
      error?: string;
    };
  } catch {
    return { success: false, error: "生成失败" };
  }
}

function getDifficultyVariant(
  difficulty: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (difficulty) {
    case "easy":
      return "default";
    case "medium":
      return "secondary";
    case "hard":
      return "destructive";
    default:
      return "outline";
  }
}

function getDifficultyText(difficulty: string): string {
  switch (difficulty) {
    case "easy":
      return "简单";
    case "medium":
      return "中等";
    case "hard":
      return "困难";
    default:
      return "未知";
  }
}

export default function CoursePage({ params }: PageProps) {
  const { id } = use(params);
  const [outline, setOutline] = useState<OutlineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const data = await getOutlineData(id);
        setOutline(data);
      } catch {
        setError("加载课程失败");
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [id]);

  const handleGenerateCourse = async () => {
    if (!outline) {
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const result = await generateCourse(outline.id);
      if (!result.success) {
        throw new Error(result.error || "生成失败");
      }

      const data = await getOutlineData(id);
      setOutline(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-200/50">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
              <p className="font-medium text-slate-600">加载中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!outline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <Card className="rounded-2xl p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <BookOpen className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-800">
                课程不存在
              </h3>
              <p className="text-slate-500">
                该课程可能已被删除，或尚未成功生成对应内容。
              </p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const chapters = outline.content || [];
  const lessons = outline.lessons || [];
  const hasGeneratedContent = lessons.length > 0;

  const getLessonStatus = (orderIndex: number) => {
    const lesson = lessons.find((item) => item.orderIndex === orderIndex);
    return {
      hasContent: Boolean(lesson?.content),
      lesson,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
      <div className="container mx-auto px-4 py-8">
        <Link
          href={`/outlines/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-slate-600 transition-colors hover:text-cyan-600"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">返回大纲</span>
        </Link>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-800">课程章节</h1>
          <p className="text-slate-500">
            {outline.project?.title ? `${outline.project.title} · ` : ""}
            共 {chapters.length} 个章节
            {hasGeneratedContent ? ` · 已生成 ${lessons.length} 个章节内容` : ""}
          </p>
        </div>

        {!hasGeneratedContent && (
          <Card className="mb-8 rounded-2xl border-2 border-dashed border-cyan-200">
            <CardContent className="py-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-100">
                <Sparkles className="h-8 w-8 text-cyan-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-800">
                准备生成课程内容
              </h3>
              <p className="mx-auto mb-6 max-w-md text-slate-500">
                课程大纲已经准备好了，点击下方按钮后会为所有章节生成课程内容。
              </p>
              <Button
                onClick={handleGenerateCourse}
                disabled={generating}
                size="lg"
                className="rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 px-8 shadow-lg shadow-cyan-200/50 hover:from-cyan-600 hover:to-cyan-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    生成课程内容
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {chapters.map((chapter) => {
            const { hasContent, lesson } = getLessonStatus(chapter.orderIndex);

            return (
              <Card key={chapter.orderIndex} className="rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 font-bold text-white shadow-md shadow-cyan-200/50">
                        {chapter.orderIndex + 1}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-slate-800">
                          {chapter.title}
                        </CardTitle>
                        <div className="mt-1 flex items-center gap-3">
                          <Badge
                            variant={getDifficultyVariant(chapter.difficulty)}
                          >
                            {getDifficultyText(chapter.difficulty)}
                          </Badge>
                          {hasContent ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                              已生成
                            </Badge>
                          ) : (
                            <Badge variant="outline">待生成</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="mb-4 text-slate-600">{chapter.description}</p>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      {(lesson?.estimatedMinutes || chapter.estimatedMinutes) && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-cyan-500" />
                          预计{" "}
                          {lesson?.estimatedMinutes || chapter.estimatedMinutes} 分钟
                        </span>
                      )}
                      {lesson?.objective && lesson.objective.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4 text-cyan-500" />
                          {lesson.objective.length} 个学习目标
                        </span>
                      )}
                    </div>

                    {hasContent && lesson && (
                      <Link href={`/lessons/${lesson.id}`}>
                        <Button className="rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-md shadow-cyan-200/50 hover:from-cyan-600 hover:to-cyan-700">
                          <BookOpen className="mr-2 h-4 w-4" />
                          开始学习
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

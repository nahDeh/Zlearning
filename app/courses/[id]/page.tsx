"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, ArrowLeft, Sparkles, Clock, Target } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  orderIndex: number;
  objective: string[];
  estimatedMinutes: number | null;
  content: string | null;
}

interface OutlineData {
  id: string;
  projectId: string;
  content: Array<{
    title: string;
    description: string;
    orderIndex: number;
    difficulty: string;
  }>;
  lessons: Lesson[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getOutlineData(outlineId: string): Promise<OutlineData | null> {
  const res = await fetch(`/api/outlines/${outlineId}`);
  if (!res.ok) return null;
  return res.json();
}

async function generateCourse(outlineId: string): Promise<{ success: boolean; lessonCount?: number; error?: string }> {
  try {
    const res = await fetch("/api/courses/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outlineId }),
    });
    const data = await res.json();
    return data;
  } catch {
    return { success: false, error: "生成失败" };
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
        const data = await getOutlineData(id);
        setOutline(data);
      } catch {
        setError("加载课程失败");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleGenerateCourse = async () => {
    if (!outline) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await generateCourse(outline.id);
      if (result.success) {
        const data = await getOutlineData(id);
        setOutline(data);
      } else {
        setError(result.error || "生成失败");
      }
    } catch {
      setError("生成失败");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-200/50">
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              </div>
              <p className="text-slate-600 font-medium">加载中...</p>
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
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="glass rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">课程不存在</h3>
              <p className="text-slate-500">该课程可能已被删除或您没有访问权限</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const chapters = outline.content || [];
  const lessons = outline.lessons || [];
  const hasGeneratedContent = lessons.length > 0;

  const getLessonStatus = (orderIndex: number): { hasContent: boolean; lesson?: Lesson } => {
    const lesson = lessons.find((l) => l.orderIndex === orderIndex);
    return {
      hasContent: !!lesson?.content,
      lesson,
    };
  };

  const getDifficultyVariant = (difficulty: string): "default" | "secondary" | "destructive" | "outline" => {
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
  };

  const getDifficultyText = (difficulty: string): string => {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
      <div className="container mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <Link href="/learn" className="inline-flex items-center gap-2 text-slate-600 hover:text-cyan-600 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">返回学习中心</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">课程章节</h1>
          <p className="text-slate-500">
            共 {chapters.length} 个章节
            {hasGeneratedContent && ` · 已生成 ${lessons.length} 个章节内容`}
          </p>
        </div>

        {!hasGeneratedContent && (
          <Card className="mb-8 glass rounded-2xl border-dashed border-2 border-cyan-200">
            <CardContent className="py-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">准备生成课程内容</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                课程大纲已创建，点击下方按钮生成所有章节内容
              </p>
              <Button 
                onClick={handleGenerateCourse} 
                disabled={generating} 
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 rounded-full px-8 shadow-lg shadow-cyan-200/50"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    生成课程内容
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {chapters.map((chapter) => {
            const { hasContent, lesson } = getLessonStatus(chapter.orderIndex);
            return (
              <Card key={chapter.orderIndex} className="glass rounded-2xl card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-bold shadow-md shadow-cyan-200/50">
                        {chapter.orderIndex}
                      </div>
                      <div>
                        <CardTitle className="text-lg text-slate-800">{chapter.title}</CardTitle>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge className={getDifficultyVariant(chapter.difficulty) === "default" ? "bg-cyan-100 text-cyan-700 hover:bg-cyan-100 border-0" : ""}>
                            {getDifficultyText(chapter.difficulty)}
                          </Badge>
                          {hasContent ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
                              已生成
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-slate-300 text-slate-500">
                              待生成
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">{chapter.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      {lesson?.estimatedMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-cyan-500" />
                          预计 {lesson.estimatedMinutes} 分钟
                        </span>
                      )}
                      {lesson?.objective && lesson.objective.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4 text-cyan-500" />
                          {lesson.objective.length} 个学习目标
                        </span>
                      )}
                    </div>
                    {hasContent && lesson && (
                      <Link href={`/lessons/${lesson.id}`}>
                        <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 rounded-full shadow-md shadow-cyan-200/50">
                          <BookOpen className="w-4 h-4 mr-2" />
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

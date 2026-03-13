"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-muted-foreground">加载中...</div>
        </div>
      </div>
    );
  }

  if (!outline) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-muted-foreground">课程不存在</div>
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">课程章节</h1>
        <p className="text-muted-foreground">
          共 {chapters.length} 个章节
          {hasGeneratedContent && ` · 已生成 ${lessons.length} 个章节内容`}
        </p>
      </div>

      {!hasGeneratedContent && (
        <Card className="mb-8 border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              课程大纲已创建，点击下方按钮生成所有章节内容
            </p>
            <Button onClick={handleGenerateCourse} disabled={generating} size="lg">
              {generating ? "生成中..." : "生成课程内容"}
            </Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {chapters.map((chapter) => {
          const { hasContent, lesson } = getLessonStatus(chapter.orderIndex);
          return (
            <Card key={chapter.orderIndex} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {chapter.orderIndex}
                    </div>
                    <CardTitle className="text-lg">{chapter.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getDifficultyVariant(chapter.difficulty)}>
                      {getDifficultyText(chapter.difficulty)}
                    </Badge>
                    {hasContent ? (
                      <Badge variant="success">已生成</Badge>
                    ) : (
                      <Badge variant="outline">待生成</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{chapter.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {lesson?.estimatedMinutes && (
                      <span>预计 {lesson.estimatedMinutes} 分钟</span>
                    )}
                    {lesson?.objective && lesson.objective.length > 0 && (
                      <span>{lesson.objective.length} 个学习目标</span>
                    )}
                  </div>
                  {hasContent && lesson && (
                    <Link href={`/lessons/${lesson.id}`}>
                      <Button>开始学习</Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LessonContent } from "@/components/lesson/LessonContent";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LessonData {
  id: string;
  outlineId: string;
  title: string;
  orderIndex: number;
  objective: string[];
  prerequisites: string[];
  content: string;
  examples: { title: string; code?: string; explanation: string }[];
  summary: string;
  estimatedMinutes: number | null;
  outline: {
    id: string;
    projectId: string;
    lessons: { id: string; title: string; orderIndex: number }[];
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getLessonData(lessonId: string): Promise<LessonData | null> {
  const res = await fetch(`/api/lessons/${lessonId}`);
  if (!res.ok) return null;
  return res.json();
}

async function regenerateLesson(lessonId: string): Promise<{ success: boolean; lesson?: LessonData; error?: string }> {
  try {
    const res = await fetch(`/api/lessons/${lessonId}/generate`, {
      method: "POST",
    });
    const data = await res.json();
    return data;
  } catch {
    return { success: false, error: "重新生成失败" };
  }
}

export default function LessonPage({ params }: PageProps) {
  const { id } = use(params);
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getLessonData(id);
        setLesson(data);
      } catch {
        setError("加载章节失败");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleRegenerate = async () => {
    if (!lesson) return;
    setRegenerating(true);
    setError(null);
    try {
      const result = await regenerateLesson(lesson.id);
      if (result.success && result.lesson) {
        setLesson(result.lesson);
      } else {
        setError(result.error || "重新生成失败");
      }
    } catch {
      setError("重新生成失败");
    } finally {
      setRegenerating(false);
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

  if (!lesson) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg text-muted-foreground">章节不存在</div>
        </div>
      </div>
    );
  }

  const allLessons = lesson.outline.lessons || [];
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href={`/courses/${lesson.outlineId}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          返回课程列表
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {lesson.orderIndex}
          </div>
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      <LessonContent
        objective={lesson.objective || []}
        prerequisites={lesson.prerequisites || []}
        content={lesson.content || ""}
        examples={lesson.examples || []}
        summary={lesson.summary || ""}
        estimatedMinutes={lesson.estimatedMinutes}
        onRegenerate={handleRegenerate}
        isRegenerating={regenerating}
      />

      <div className="mt-8 flex items-center justify-between">
        {prevLesson ? (
          <Link href={`/lessons/${prevLesson.id}`}>
            <Button variant="outline">
              <ChevronLeft className="w-4 h-4 mr-1" />
              上一节：{prevLesson.title}
            </Button>
          </Link>
        ) : (
          <div />
        )}
        {nextLesson ? (
          <Link href={`/lessons/${nextLesson.id}`}>
            <Button>
              下一节：{nextLesson.title}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        ) : (
          <div />
        )}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">课程进度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allLessons.map((l, index) => (
              <Link key={l.id} href={`/lessons/${l.id}`}>
                <Badge
                  variant={l.id === lesson.id ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  {index + 1}. {l.title}
                </Badge>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

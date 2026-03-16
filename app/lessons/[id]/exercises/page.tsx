"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { ExerciseQuiz } from "@/components/exercise/ExerciseQuiz";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Exercise {
  id: string;
  lessonId: string;
  type: string;
  question: string;
  options: string[];
  explanation: string;
  difficulty: string | null;
}

export default function LessonExercisesPage() {
  const params = useParams();
  const lessonId = params.id as string;

  const [exercises, setExercises] = React.useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchExercises = React.useCallback(async () => {
    if (!lessonId) return;

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/lessons/${lessonId}/exercises`);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "获取练习题失败");
      }

      const data = (await res.json()) as Exercise[];
      setExercises(Array.isArray(data) ? data : []);
    } catch (err) {
      setExercises([]);
      setError(err instanceof Error ? err.message : "获取练习题失败");
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  React.useEffect(() => {
    void fetchExercises();
  }, [fetchExercises]);

  const handleGenerate = async () => {
    if (!lessonId) return;

    try {
      setIsGenerating(true);
      setError(null);

      const res = await fetch(`/api/lessons/${lessonId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 3 }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        exercises?: Exercise[];
        error?: string;
      };

      if (!res.ok || !data.success) {
        throw new Error(data.error || "生成练习题失败");
      }

      setExercises(Array.isArray(data.exercises) ? data.exercises : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成练习题失败");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
      <div className="container mx-auto max-w-3xl px-4 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <Link href={`/lessons/${lessonId}`}>
            <Button
              variant="ghost"
              className="text-slate-600 hover:bg-cyan-50 hover:text-cyan-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回章节
            </Button>
          </Link>
          <div className="flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sm text-slate-600 shadow-sm">
            <Sparkles className="h-4 w-4 text-cyan-600" />
            章节练习
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <Card className="glass rounded-2xl border-0 shadow-xl">
            <CardContent className="py-12">
              <div className="flex items-center justify-center gap-3 text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
                加载练习题...
              </div>
            </CardContent>
          </Card>
        ) : exercises.length === 0 ? (
          <Card className="glass rounded-2xl border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-slate-800">还没有练习题</CardTitle>
              <CardDescription className="text-slate-500">
                点击按钮生成 3 道选择题，帮助巩固本章知识点。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-200/50 hover:from-cyan-600 hover:to-cyan-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  "生成练习题"
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ExerciseQuiz exercises={exercises} />
        )}
      </div>
    </div>
  );
}


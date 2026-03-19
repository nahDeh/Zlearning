"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface LessonData {
  id: string;
  outlineId: string;
  title: string;
  objective: string[];
  prerequisites: string[];
  content: string;
  summary: string;
  estimatedMinutes: number | null;
  outline: {
    id: string;
    projectId: string;
  };
}

interface UpdateLessonResponse {
  success?: boolean;
  error?: string;
  lesson?: {
    id: string;
    outlineId: string;
  };
}

function splitLines(input: string): string[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default function LessonEditPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params.id as string;

  const [lesson, setLesson] = React.useState<LessonData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [estimatedMinutes, setEstimatedMinutes] = React.useState("");
  const [objectiveText, setObjectiveText] = React.useState("");
  const [prerequisiteText, setPrerequisiteText] = React.useState("");
  const [content, setContent] = React.useState("");
  const [summary, setSummary] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    async function loadLesson() {
      try {
        setIsLoading(true);
        setError(null);
        setSaved(false);

        const response = await fetch(`/api/lessons/${lessonId}`);
        if (!response.ok) {
          throw new Error("加载章节失败");
        }

        const data = (await response.json()) as LessonData;
        if (!cancelled) {
          setLesson(data);
          setTitle(data.title ?? "");
          setEstimatedMinutes(
            typeof data.estimatedMinutes === "number" ? String(data.estimatedMinutes) : ""
          );
          setObjectiveText((data.objective ?? []).join("\n"));
          setPrerequisiteText((data.prerequisites ?? []).join("\n"));
          setContent(data.content ?? "");
          setSummary(data.summary ?? "");
        }
      } catch (err) {
        if (!cancelled) {
          setLesson(null);
          setError(err instanceof Error ? err.message : "加载章节失败");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadLesson();

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  const handleSave = async () => {
    if (!lesson) return;

    try {
      setIsSaving(true);
      setError(null);
      setSaved(false);

      const parsedMinutesRaw = estimatedMinutes.trim();
      const parsedMinutes =
        parsedMinutesRaw.length === 0 ? null : Number.parseInt(parsedMinutesRaw, 10);

      if (parsedMinutesRaw.length > 0 && Number.isNaN(parsedMinutes)) {
        throw new Error("预计学习时间必须是数字");
      }

      const payload = {
        title: title.trim(),
        estimatedMinutes: parsedMinutes,
        objective: splitLines(objectiveText),
        prerequisites: splitLines(prerequisiteText),
        content,
        summary,
      };

      const response = await fetch(`/api/lessons/${lesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as UpdateLessonResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.error || "保存失败");
      }

      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <div className="container mx-auto max-w-3xl px-4 py-10">
          <Card className="rounded-2xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-red-600">章节不存在</CardTitle>
              <CardDescription>{error || "无法加载章节内容"}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.back()} className="rounded-full">
                返回
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                aria-label="返回课程"
                onClick={() => router.push(`/courses/${lesson.outlineId}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-slate-800">
                  编辑章节：{lesson.title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  修改课程内容后，可立即在学习页生效
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/lessons/${lesson.id}`}>
                <Button variant="outline" className="rounded-full">
                  去学习
                </Button>
              </Link>
              <Button
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-md shadow-cyan-200/50 hover:from-cyan-600 hover:to-cyan-700"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {(error || saved) && (
          <div
            className={`mb-6 rounded-xl border p-4 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {error ? error : "已保存"}
          </div>
        )}

        <Card className="rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">章节信息</CardTitle>
            <CardDescription>标题、目标、内容与总结</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lesson-title">标题</Label>
                <Input
                  id="lesson-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="章节标题"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-minutes">预计学习时间（分钟）</Label>
                <Input
                  id="lesson-minutes"
                  value={estimatedMinutes}
                  onChange={(event) => setEstimatedMinutes(event.target.value)}
                  placeholder="例如 45"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lesson-objective">学习目标（每行一个）</Label>
                <Textarea
                  id="lesson-objective"
                  value={objectiveText}
                  onChange={(event) => setObjectiveText(event.target.value)}
                  placeholder="例如：理解事件循环的执行顺序"
                  className="min-h-[120px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-prereq">前置知识（每行一个）</Label>
                <Textarea
                  id="lesson-prereq"
                  value={prerequisiteText}
                  onChange={(event) => setPrerequisiteText(event.target.value)}
                  placeholder="例如：掌握基本语法"
                  className="min-h-[120px]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-content">核心内容（Markdown）</Label>
              <Textarea
                id="lesson-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="支持 Markdown（##/### 标题、代码块等）"
                className="min-h-[360px] font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-summary">总结</Label>
              <Textarea
                id="lesson-summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="本章总结"
                className="min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


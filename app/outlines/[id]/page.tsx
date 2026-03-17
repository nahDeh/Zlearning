"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Loader2, Target, Trash2 } from "lucide-react";
import { OutlineChapter } from "@/types/outline";
import { OutlineEditor } from "@/components/outline/OutlineEditor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OutlineData {
  id: string;
  projectId: string;
  version: number;
  content: OutlineChapter[];
  isActive: boolean;
  createdAt: string;
  project?: {
    id: string;
    title: string;
    profile?: {
      topic?: string;
      goal?: string;
    } | null;
  } | null;
}

interface OutlineApiResponse {
  success: boolean;
  outline?: OutlineData;
  error?: string;
}

export default function OutlinePage() {
  const params = useParams();
  const router = useRouter();
  const outlineId = params.id as string;

  const [outline, setOutline] = React.useState<OutlineData | null>(null);
  const [chapters, setChapters] = React.useState<OutlineChapter[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchOutline = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/outlines/${outlineId}`);
      const data = (await response.json()) as OutlineApiResponse;

      if (!response.ok || !data.success || !data.outline) {
        throw new Error(data.error || "获取大纲失败");
      }

      setOutline(data.outline);
      setChapters(data.outline.content || []);
    } catch (err) {
      setOutline(null);
      setChapters([]);
      setError(err instanceof Error ? err.message : "获取大纲失败");
    } finally {
      setIsLoading(false);
    }
  }, [outlineId]);

  React.useEffect(() => {
    void fetchOutline();
  }, [fetchOutline]);

  const saveOutline = React.useCallback(async () => {
    if (!outline) {
      throw new Error("大纲不存在");
    }

    const response = await fetch(`/api/outlines/${outlineId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapters }),
    });
    const data = (await response.json()) as OutlineApiResponse;

    if (!response.ok || !data.success || !data.outline) {
      throw new Error(data.error || "保存失败");
    }

    const nextOutline: OutlineData = {
      ...outline,
      ...data.outline,
      content: data.outline.content || chapters,
    };

    setOutline(nextOutline);
    setChapters(nextOutline.content);

    return nextOutline;
  }, [chapters, outline, outlineId]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      await saveOutline();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      setError(null);
      const savedOutline = await saveOutline();
      router.push(`/courses/${savedOutline.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "确认失败");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDeleteOutline = async () => {
    if (!outline) return;

    const confirmed = window.confirm(
      "确定删除该大纲及其已生成的课程内容吗？删除后可在项目页重新生成。"
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(`/api/outlines/${outlineId}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "删除大纲失败");
      }

      router.push(`/projects/${outline.projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除大纲失败，请稍后重试");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
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
            <Button
              variant="outline"
              size="icon"
              aria-label="删除大纲"
              disabled={isDeleting || isSaving || isConfirming}
              onClick={handleDeleteOutline}
              className="rounded-full border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
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
            <Card className="w-full max-w-md rounded-2xl border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-red-600">{error || "大纲不存在"}</CardTitle>
                <CardDescription className="text-slate-500">
                  {error || "该大纲可能已被删除或您没有访问权限。"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={fetchOutline} className="w-full">
                  重新加载
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 text-slate-600 hover:bg-cyan-50 hover:text-cyan-600"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">学习大纲</h1>
              {outline.project && (
                <p className="mt-1 text-slate-500">
                  {outline.project.title}
                  {outline.project.profile?.topic
                    ? ` - ${outline.project.profile.topic}`
                    : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500">
                版本 {outline.version}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        <Card className="mb-6 rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
              <Target className="h-5 w-5 text-cyan-500" />
              学习目标
            </CardTitle>
            <CardDescription className="text-slate-500">
              {outline.project?.profile?.goal || "暂无学习目标"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <BookOpen className="h-4 w-4 text-cyan-500" />
              当前大纲共 {chapters.length} 个章节，可拖拽调整顺序、编辑内容后保存。
            </div>
          </CardContent>
        </Card>

        <OutlineEditor
          chapters={chapters}
          onChange={setChapters}
          onSave={handleSave}
          isSaving={isSaving}
          onConfirm={handleConfirm}
          isConfirming={isConfirming}
        />
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { OutlineChapter } from "@/types/outline";
import { OutlineEditor } from "@/components/outline/OutlineEditor";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, RefreshCw, Target, BookOpen } from "lucide-react";

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
      topic: string;
      goal: string;
    } | null;
  };
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
  const [error, setError] = React.useState<string | null>(null);

  const fetchOutline = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/outlines/${outlineId}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "获取大纲失败");
      }

      setOutline(data.outline);
      setChapters(data.outline.content || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取大纲失败");
    } finally {
      setIsLoading(false);
    }
  }, [outlineId]);

  React.useEffect(() => {
    fetchOutline();
  }, [fetchOutline]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/outlines/${outlineId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chapters }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "保存失败");
      }

      setOutline(data.outline);
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);

      await handleSave();

      router.push(`/projects/${outline?.projectId}/lessons`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "确认失败");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleChaptersChange = (newChapters: OutlineChapter[]) => {
    setChapters(newChapters);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-200/50">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
          <p className="text-slate-600 font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20 flex items-center justify-center">
        <Card className="w-full max-w-md glass rounded-2xl shadow-xl">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <RefreshCw className="h-4 w-4" />
              </div>
              加载失败
            </CardTitle>
            <CardDescription className="text-slate-500">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchOutline} className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!outline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20 flex items-center justify-center">
        <Card className="glass rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">大纲不存在</h3>
          <p className="text-slate-500">该大纲可能已被删除或您没有访问权限</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
      <div className="container max-w-4xl py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 text-slate-600 hover:text-cyan-600 hover:bg-cyan-50"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">学习大纲</h1>
              {outline.project && (
                <p className="text-slate-500 mt-1">
                  {outline.project.title}
                  {outline.project.profile?.topic && ` - ${outline.project.profile.topic}`}
                </p>
              )}
            </div>
            <div className="text-sm text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              版本 {outline.version}
            </div>
          </div>
        </div>

        <Card className="mb-6 glass rounded-2xl shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
              <Target className="h-5 w-5 text-cyan-500" />
              学习目标
            </CardTitle>
            <CardDescription className="text-slate-500">
              {outline.project?.profile?.goal || "暂无学习目标"}
            </CardDescription>
          </CardHeader>
        </Card>

        <OutlineEditor
          chapters={chapters}
          onChange={handleChaptersChange}
          onSave={handleSave}
          isSaving={isSaving}
          onConfirm={handleConfirm}
          isConfirming={isConfirming}
        />
      </div>
    </div>
  );
}

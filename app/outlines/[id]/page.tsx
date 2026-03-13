"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { OutlineChapter } from "@/types/outline";
import { OutlineEditor } from "@/components/outline/OutlineEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">加载失败</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchOutline} className="w-full">
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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">大纲不存在</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">学习大纲</h1>
            {outline.project && (
              <p className="text-muted-foreground mt-1">
                {outline.project.title}
                {outline.project.profile?.topic && ` - ${outline.project.profile.topic}`}
              </p>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            版本 {outline.version}
          </div>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">学习目标</CardTitle>
          <CardDescription>
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
  );
}

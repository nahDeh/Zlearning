"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LearningProfileDraft } from "@/types/questionnaire";
import {
  CheckCircle2,
  Clock,
  Target,
  BookOpen,
  Lightbulb,
  User,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const levelLabels: Record<string, string> = {
  beginner: "零基础入门",
  intermediate: "有一定基础",
  advanced: "进阶学习",
};

const styleLabels: Record<string, string> = {
  visual: "视觉学习",
  practical: "实践学习",
  theoretical: "理论学习",
  mixed: "综合学习",
};

export default function ConfirmPage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<LearningProfileDraft | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const stored = sessionStorage.getItem("learningProfile");
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {
        router.push("/onboarding");
      }
    } else {
      router.push("/onboarding");
    }
  }, [router]);

  async function handleConfirm() {
    if (!profile) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: profile.topic,
          profile,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.removeItem("learningProfile");
        router.push(`/projects/${data.projectId}`);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      setIsSaving(false);
    }
  }

  function handleEdit() {
    sessionStorage.removeItem("learningProfile");
    router.push("/onboarding");
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">你的学习画像已生成</CardTitle>
          <CardDescription>
            请确认以下信息是否准确，我们将据此为你定制学习计划
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <BookOpen className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">学习主题</p>
                <p className="font-medium">{profile.topic}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Target className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">学习目标</p>
                <p className="font-medium line-clamp-2">{profile.goal}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <User className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">当前水平</p>
                <Badge variant="secondary">{levelLabels[profile.currentLevel]}</Badge>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">每周学习时间</p>
                <p className="font-medium">约 {profile.timeBudget} 小时</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">学习风格</p>
                <Badge variant="outline">{styleLabels[profile.learningStyle]}</Badge>
              </div>
            </div>
          </div>

          {profile.background && (
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-1">背景信息</p>
              <p className="text-sm">{profile.background}</p>
            </div>
          )}

          {profile.preferences && profile.preferences.length > 0 && (
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground mb-2">学习偏好</p>
              <div className="flex flex-wrap gap-2">
                {profile.preferences.map((pref, index) => (
                  <Badge key={index} variant="secondary">
                    {pref}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={handleEdit}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            重新填写
          </Button>
          <Button onClick={handleConfirm} disabled={isSaving}>
            {isSaving ? "保存中..." : "确认并开始学习"}
            {!isSaving && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

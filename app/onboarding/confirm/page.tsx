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
  Loader2,
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-200/50">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
          <p className="text-slate-600 font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
      <Card className="w-full max-w-2xl glass rounded-3xl shadow-xl border-0">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-200/50">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-slate-800">你的学习画像已生成</CardTitle>
          <CardDescription className="text-slate-500 mt-2">
            请确认以下信息是否准确，我们将据此为你定制学习计划
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-50/50 border border-cyan-100">
              <BookOpen className="h-5 w-5 text-cyan-600 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">学习主题</p>
                <p className="font-medium text-slate-800">{profile.topic}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-50/50 border border-cyan-100">
              <Target className="h-5 w-5 text-cyan-600 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">学习目标</p>
                <p className="font-medium text-slate-800 line-clamp-2">{profile.goal}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-50/50 border border-cyan-100">
              <User className="h-5 w-5 text-cyan-600 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">当前水平</p>
                <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 border-0">{levelLabels[profile.currentLevel]}</Badge>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-50/50 border border-cyan-100">
              <Clock className="h-5 w-5 text-cyan-600 mt-0.5" />
              <div>
                <p className="text-sm text-slate-500">每周学习时间</p>
                <p className="font-medium text-slate-800">约 {profile.timeBudget} 小时</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cyan-50/50 border border-cyan-100">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-cyan-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-slate-500 mb-2">学习风格</p>
                <Badge variant="outline" className="border-cyan-300 text-cyan-700">{styleLabels[profile.learningStyle]}</Badge>
              </div>
            </div>
          </div>

          {profile.background && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">背景信息</p>
              <p className="text-sm text-slate-700">{profile.background}</p>
            </div>
          )}

          {profile.preferences && profile.preferences.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-sm text-slate-500 mb-2">学习偏好</p>
              <div className="flex flex-wrap gap-2">
                {profile.preferences.map((pref, index) => (
                  <Badge key={index} className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 border-0">
                    {pref}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between pt-6">
          <Button variant="ghost" onClick={handleEdit} className="text-slate-600 hover:text-slate-800 hover:bg-slate-100">
            <ArrowLeft className="mr-2 h-4 w-4" />
            重新填写
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isSaving}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-full px-6 shadow-lg shadow-cyan-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-200/40 hover:-translate-y-0.5"
          >
            {isSaving ? "保存中..." : "确认并开始学习"}
            {!isSaving && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

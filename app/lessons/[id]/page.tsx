"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markdownToHtml } from "@/lib/markdown";
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Moon, 
  Maximize2,
  MessageCircle,
  CheckCircle,
  Edit3,
  Loader2,
  BookOpen,
  Sparkles,
  Target
} from "lucide-react";

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
  params: { id: string };
}

async function getLessonData(lessonId: string): Promise<LessonData | null> {
  const res = await fetch(`/api/lessons/${lessonId}`);
  if (!res.ok) return null;
  return res.json();
}

export default function LessonPage({ params }: PageProps) {
  const { id } = params;
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("简介");
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isMarkedComplete, setIsMarkedComplete] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const studyStartedAtRef = useRef<number | null>(null);
  const hasReportedStudyTimeRef = useRef(false);
  const lessonIdForProgress = lesson?.id ?? null;
  const projectIdForProgress = lesson?.outline.projectId ?? null;

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getLessonData(id);
        setLesson(data);
      } catch {
        console.error("加载章节失败");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!lessonIdForProgress || !projectIdForProgress) {
      return;
    }

    const lessonId = lessonIdForProgress;
    const projectId = projectIdForProgress;
    const startedAt = Date.now();

    studyStartedAtRef.current = startedAt;
    hasReportedStudyTimeRef.current = false;
    setIsMarkedComplete(false);
    setProgressError(null);

    void fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonId,
        projectId,
        status: "in_progress",
        studyTime: 0,
      }),
    }).catch((error) => {
      console.warn("Failed to mark lesson in progress:", error);
    });

    return () => {
      if (hasReportedStudyTimeRef.current) {
        return;
      }

      const minutes = Math.max(0, Math.round((Date.now() - startedAt) / 60000));
      if (minutes <= 0) {
        return;
      }

      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          projectId,
          studyTime: minutes,
        }),
        keepalive: true,
      }).catch((error) => {
        console.warn("Failed to report study time:", error);
      });
    };
  }, [lessonIdForProgress, projectIdForProgress]);

  const handleMarkMastered = async () => {
    if (!lesson || isMarkingComplete || isMarkedComplete) {
      return;
    }

    try {
      setIsMarkingComplete(true);
      setProgressError(null);

      const now = Date.now();
      const startedAt = studyStartedAtRef.current ?? now;
      const minutes = Math.max(0, Math.round((now - startedAt) / 60000));

      hasReportedStudyTimeRef.current = true;

      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          projectId: lesson.outline.projectId,
          status: "completed",
          studyTime: minutes,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!res.ok || !data.success) {
        throw new Error(data.error || "标记完成失败");
      }

      setIsMarkedComplete(true);
    } catch (error) {
      hasReportedStudyTimeRef.current = false;
      setProgressError(error instanceof Error ? error.message : "标记完成失败");
    } finally {
      setIsMarkingComplete(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          </div>
          <p className="text-slate-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-300 mb-2">章节不存在</h3>
          <p className="text-slate-500">该章节可能已被删除或您没有访问权限</p>
        </div>
      </div>
    );
  }

  const allLessons = lesson.outline.lessons || [];
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // 目录结构
  const tocItems = [
    { id: "intro", title: "简介" },
    { id: "event-loop", title: "事件循环" },
    { id: "coroutine", title: "协程" },
    { id: "practice", title: "实战练习" },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* 顶部导航栏 */}
      <header className="glass-dark border-b border-slate-700/50 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/learn" className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">返回</span>
            </Link>
            <div className="h-6 w-px bg-slate-700" />
            <h1 className="text-sm font-medium text-slate-200">
              第 {lesson.orderIndex} 章：{lesson.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-colors">
              <Moon className="w-5 h-5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-colors">
              <Maximize2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 左侧目录 */}
        <aside className="w-72 glass-dark border-r border-slate-700/50 min-h-[calc(100vh-60px)] p-5">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-400" />
              目录
            </h2>
            <nav className="space-y-1">
              {tocItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.title)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                    activeSection === item.title
                      ? "bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 text-cyan-400 border border-cyan-500/30"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </nav>
          </div>

          {/* AI 教练按钮 */}
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all group">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/30 transition-colors">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-sm font-medium block">AI 教练</span>
              <span className="text-xs text-cyan-400/70">随时为你解答</span>
            </div>
          </button>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 p-8 max-w-4xl">
          {/* 章节标题 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <span className="text-xl">🚀</span>
              </div>
              <h1 className="text-2xl font-bold text-white">
                {lesson.title}
              </h1>
            </div>
            {lesson.objective && lesson.objective.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {lesson.objective.map((obj, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-sm border border-cyan-500/20">
                    {obj}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 代码示例 */}
          <div className="bg-slate-800 rounded-xl overflow-hidden mb-8 border border-slate-700">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-700/50 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-slate-400 ml-2">python</span>
              </div>
              <button className="text-xs text-slate-400 hover:text-cyan-400 transition-colors">
                复制代码
              </button>
            </div>
            <pre className="p-4 text-sm font-mono text-slate-300 overflow-x-auto leading-relaxed">
              <code>{`import asyncio

async def main():
    await asyncio.sleep(1)
    print("Done")

...

asyncio.run(main())`}</code>
            </pre>
          </div>

          {/* 实际课程内容 */}
          {lesson.content && (
            <div className="prose prose-invert max-w-none mb-8">
              <div
                dangerouslySetInnerHTML={{ __html: markdownToHtml(lesson.content) }}
              />
            </div>
          )}

          {/* 示例列表 */}
          {lesson.examples && lesson.examples.length > 0 && (
            <div className="space-y-6 mb-8">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <span className="text-cyan-400 text-sm">&lt;/&gt;</span>
                </div>
                代码示例
              </h3>
              {lesson.examples.map((example, index) => (
                <div key={index} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h4 className="text-lg font-medium text-cyan-400 mb-3">{example.title}</h4>
                  {example.code && (
                    <pre className="bg-slate-900 rounded-lg p-4 text-sm font-mono text-slate-300 overflow-x-auto mb-3 border border-slate-700">
                      <code>{example.code}</code>
                    </pre>
                  )}
                  <p className="text-slate-400 text-sm">{example.explanation}</p>
                </div>
              ))}
            </div>
          )}

          {/* 总结 */}
          {lesson.summary && (
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-6 mb-8 border border-cyan-500/20">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-cyan-400" />
                本章总结
              </h3>
              <p className="text-slate-300 leading-relaxed">{lesson.summary}</p>
            </div>
          )}

          {/* 底部操作栏 */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-700/50">
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 rounded-xl">
                <Edit3 className="w-4 h-4 mr-2" />
                记录笔记
              </Button>
              <Link href={`/lessons/${lesson.id}/exercises`}>
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 rounded-xl">
                  <Target className="w-4 h-4 mr-2" />
                  去做练习
                </Button>
              </Link>
              <Button
                onClick={() => void handleMarkMastered()}
                disabled={isMarkingComplete || isMarkedComplete}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg shadow-green-500/20 disabled:opacity-60"
              >
                {isMarkingComplete ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {isMarkedComplete ? "已掌握" : "我已掌握"}
              </Button>
            </div>

            <div className="flex gap-3">
              {prevLesson && (
                <Link href={`/lessons/${prevLesson.id}`}>
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 rounded-xl">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    上一节
                  </Button>
                </Link>
              )}
              {nextLesson && (
                <Link href={`/lessons/${nextLesson.id}`}>
                  <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl shadow-lg shadow-cyan-500/20">
                    下一节
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {progressError && (
            <p className="mt-3 text-sm text-red-400">{progressError}</p>
          )}
        </main>

        {/* 右侧课程进度 */}
        <aside className="w-72 glass-dark border-l border-slate-700/50 min-h-[calc(100vh-60px)] p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-cyan-500/20 flex items-center justify-center">
              <span className="text-cyan-400 text-xs">#</span>
            </div>
            课程进度
          </h3>
          <div className="space-y-1">
            {allLessons.map((l, index) => (
              <Link key={l.id} href={`/lessons/${l.id}`}>
                <div
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                    l.id === lesson.id
                      ? "bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 text-cyan-400 border border-cyan-500/30"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <span className={`text-xs w-5 ${l.id === lesson.id ? 'text-cyan-400' : 'text-slate-500'}`}>{index + 1}</span>
                  <span className="line-clamp-1">{l.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

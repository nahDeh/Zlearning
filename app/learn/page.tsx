"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Clock, 
  Play, 
  Plus, 
  Loader2, 
  Calendar,
  Trophy,
  Bell,
  Bookmark,
  Flame,
  Trash2
} from "lucide-react";

interface LearningProject {
  id: string;
  title: string;
  status: string;
  currentLessonId: string | null;
  createdAt: string;
  profile?: {
    topic: string;
    goal: string;
    currentLevel: string;
  };
}

interface StudyProgress {
  projectId: string;
  totalLessons: number;
  completedLessons: number;
  completionRate: number;
  totalStudyTime: number;
  currentLessonId: string | null;
}

// 活跃度热力图组件
function ActivityHeatmap() {
  // 生成模拟的52周学习数据
  const weeks = 52;
  const daysPerWeek = 7;
  const data = Array.from({ length: weeks }, () =>
    Array.from({ length: daysPerWeek }, () => Math.random())
  );

  const getIntensityColor = (value: number) => {
    if (value === 0) return "bg-slate-100";
    if (value < 0.3) return "bg-cyan-200";
    if (value < 0.6) return "bg-cyan-300";
    if (value < 0.8) return "bg-cyan-400";
    return "bg-cyan-500";
  };

  return (
    <div className="flex gap-1">
      {data.map((week, weekIndex) => (
        <div key={weekIndex} className="flex flex-col gap-1">
          {week.map((day, dayIndex) => (
            <div
              key={dayIndex}
              className={`w-3 h-3 rounded-sm ${getIntensityColor(day)}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// 学习雷达图组件
function LearningRadarChart() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="mx-auto">
      {/* 背景网格 */}
      <polygon
        points="70,20 110,55 95,110 45,110 30,55"
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="1"
      />
      <polygon
        points="70,35 95,60 85,95 55,95 45,60"
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="1"
      />
      <polygon
        points="70,50 80,65 75,80 65,80 60,65"
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="1"
      />
      {/* 轴线 */}
      <line x1="70" y1="20" x2="70" y2="110" stroke="#E2E8F0" strokeWidth="1" />
      <line x1="30" y1="55" x2="110" y2="55" stroke="#E2E8F0" strokeWidth="1" />
      <line x1="45" y1="110" x2="95" y2="20" stroke="#E2E8F0" strokeWidth="1" />
      {/* 数据区域 */}
      <polygon
        points="70,25 100,52 88,100 52,100 40,52"
        fill="rgba(34, 211, 238, 0.3)"
        stroke="#22D3EE"
        strokeWidth="2"
      />
      {/* 数据点 */}
      <circle cx="70" cy="25" r="4" fill="#22D3EE" />
      <circle cx="100" cy="52" r="4" fill="#22D3EE" />
      <circle cx="88" cy="100" r="4" fill="#22D3EE" />
      <circle cx="52" cy="100" r="4" fill="#22D3EE" />
      <circle cx="40" cy="52" r="4" fill="#22D3EE" />
      {/* 标签 */}
      <text x="70" y="15" textAnchor="middle" className="text-xs fill-slate-500">基础</text>
      <text x="120" y="58" textAnchor="start" className="text-xs fill-slate-500">思维</text>
      <text x="95" y="125" textAnchor="middle" className="text-xs fill-slate-500">实践</text>
    </svg>
  );
}

export default function LearnPage() {
  const [projects, setProjects] = useState<LearningProject[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, StudyProgress>>({});
  const [loading, setLoading] = useState(true);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [deleteProjectError, setDeleteProjectError] = useState<string | null>(
    null
  );
  const getProjectHref = (projectId: string, currentLessonId: string | null) =>
    currentLessonId ? `/lessons/${currentLessonId}` : `/projects/${projectId}`;

  useEffect(() => {
    async function fetchData() {
      try {
        const projectsRes = await fetch("/api/projects");
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json();
          setProjects(projectsData.projects || []);

          for (const project of projectsData.projects || []) {
            const progressRes = await fetch(`/api/progress?projectId=${project.id}`);
            if (progressRes.ok) {
              const progressData = await progressRes.json();
              setProgressMap((prev) => ({
                ...prev,
                [project.id]: progressData,
              }));
            }
          }
        }
      } catch (error) {
        console.error("加载数据失败:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleDeleteProject = async (projectId: string) => {
    const confirmed = window.confirm(
      "确定删除该项目吗？删除后该项目的资料、课程与学习记录都会被移除。"
    );
    if (!confirmed) return;

    try {
      setDeletingProjectId(projectId);
      setDeleteProjectError(null);

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "删除项目失败");
      }

      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      setProgressMap((prev) => {
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
    } catch (error) {
      setDeleteProjectError(
        error instanceof Error ? error.message : "删除项目失败，请稍后重试"
      );
    } finally {
      setDeletingProjectId(null);
    }
  };

  const currentProject = projects[0];
  const currentProgress = currentProject ? progressMap[currentProject.id] : null;
  const currentProjectHref = currentProject
    ? getProjectHref(currentProject.id, currentProgress?.currentLessonId ?? null)
    : "/onboarding";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-200/50">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
            <p className="text-slate-600 font-medium">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
      {/* 顶部状态栏 */}
      <div className="bg-slate-900 text-white px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium">连续学习 12 天</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">知识等级：Level 4</span>
            </div>
          </div>
          <button className="flex items-center gap-2 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">
            <Bell className="w-4 h-4" />
            <span className="text-sm">通知</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 主内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 左侧：当前项目进度 */}
          <Card className="lg:col-span-2 glass rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-md shadow-cyan-200/50">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">
                  当前项目：{currentProject?.title || "Python 自动化"}
                </h2>
              </div>

              <div className="flex flex-col items-center justify-center py-4">
                {/* 环形进度 */}
                <div className="relative w-44 h-44 mb-8">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22D3EE" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#E2E8F0"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="url(#cyanGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(currentProgress?.completionRate || 75) * 2.64} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-slate-800">
                      {currentProgress?.completionRate || 75}%
                    </span>
                    <span className="text-sm text-slate-500 mt-1">已完成</span>
                  </div>
                </div>

                <Link href={currentProjectHref} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 rounded-full inline-block mt-4">
                  <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-full px-8 shadow-lg shadow-cyan-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-200/40 hover:-translate-y-0.5">
                    <Play className="w-4 h-4 mr-2" />
                    继续学习第 {currentProgress?.completedLessons ? currentProgress.completedLessons + 1 : 8} 章
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 右侧：学习雷达图 */}
          <Card className="glass rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-slate-800">学习雷达图</h2>
              </div>
              <LearningRadarChart />
            </CardContent>
          </Card>

          {/* 活跃度热力图 */}
          <Card className="lg:col-span-2 glass rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">活跃度</h2>
              </div>
              <div className="overflow-x-auto">
                <ActivityHeatmap />
              </div>
            </CardContent>
          </Card>

          {/* 收藏知识点 */}
          <Card className="glass rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <Bookmark className="w-4 h-4 text-cyan-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">收藏知识点</h2>
              </div>
              <div className="space-y-3">
                <div role="button" tabIndex={0} className="flex items-start gap-3 p-3 bg-cyan-50/50 rounded-xl border border-cyan-100 hover:bg-cyan-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1">
                  <Bookmark className="w-4 h-4 text-cyan-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Decorator Parsing</p>
                    <p className="text-xs text-slate-500">装饰器解析</p>
                  </div>
                </div>
                <div role="button" tabIndex={0} className="flex items-start gap-3 p-3 bg-cyan-50/50 rounded-xl border border-cyan-100 hover:bg-cyan-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1">
                  <Bookmark className="w-4 h-4 text-cyan-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Asynchronous Programming</p>
                    <p className="text-xs text-slate-500">异步编程原理</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 学习项目列表 */}
        {projects.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">我的学习项目</h2>
              <Link href="/onboarding">
                <Button variant="outline" className="border-cyan-300 text-cyan-600 hover:bg-cyan-50 rounded-full px-4">
                  <Plus className="w-4 h-4 mr-2" />
                  新建项目
                </Button>
              </Link>
            </div>
            {deleteProjectError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {deleteProjectError}
              </div>
            )}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => {
                const progress = progressMap[project.id];
                return (
                  <Card key={project.id} className="glass rounded-2xl shadow-lg hover:shadow-xl transition-all card-hover">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4 gap-3">
                        <h3 className="font-semibold text-slate-800 line-clamp-1">{project.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge
                          variant={project.status === "active" ? "default" : "secondary"}
                          className={project.status === "active" ? "bg-gradient-to-r from-cyan-500 to-cyan-600 border-0" : ""}
                        >
                          {project.status === "active" ? "进行中" : "已完成"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="删除项目"
                          disabled={deletingProjectId !== null}
                          onClick={() => void handleDeleteProject(project.id)}
                          className="h-8 w-8 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          {deletingProjectId === project.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                      </Button>
                      </div>
                      </div>
                       
                      {progress && (
                        <>
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">学习进度</span>
                              <span className="font-semibold text-cyan-600">{progress.completionRate}%</span>
                            </div>
                            <Progress value={progress.completionRate} className="h-2 bg-slate-200 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-cyan-600" />
                          </div>

                          <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4 text-cyan-500" />
                              <span>{progress.completedLessons} / {progress.totalLessons} 章节</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-cyan-500" />
                              <span>{progress.totalStudyTime} 分钟</span>
                            </div>
                          </div>
                        </>
                      )}

                      <Link href={getProjectHref(project.id, progress?.currentLessonId ?? null)} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 rounded-xl block mt-4">
                        <Button className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 rounded-xl shadow-md shadow-cyan-200/50 transition-all duration-300 hover:shadow-lg">
                          <Play className="w-4 h-4 mr-2" />
                          {progress?.currentLessonId ? "继续学习" : "开始学习"}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {projects.length === 0 && (
          <Card className="mt-10 glass rounded-2xl shadow-lg">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-cyan-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-cyan-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">还没有学习项目</h3>
              <p className="text-slate-500 mb-6">创建你的第一个学习项目，开始个性化学习之旅</p>
              <Link href="/onboarding" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 rounded-full inline-block mt-4">
                <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 rounded-full px-6 shadow-lg shadow-cyan-200/50">
                  <Plus className="w-4 h-4 mr-2" />
                  创建学习项目
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

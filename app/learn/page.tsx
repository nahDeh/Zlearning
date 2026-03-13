"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Play, Plus, Loader2 } from "lucide-react";

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

export default function LearnPage() {
  const [projects, setProjects] = useState<LearningProject[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, StudyProgress>>({});
  const [loading, setLoading] = useState(true);

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

  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      beginner: "初学者",
      intermediate: "中级",
      advanced: "高级",
    };
    return labels[level] || level;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">学习中心</h1>
          <p className="text-muted-foreground mt-1">管理你的学习进度</p>
        </div>
        <Link href="/onboarding">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新建学习项目
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">还没有学习项目</h3>
            <p className="text-muted-foreground mb-4">
              创建你的第一个学习项目，开始个性化学习之旅
            </p>
            <Link href="/onboarding">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                创建学习项目
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const progress = progressMap[project.id];
            return (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-1">
                      {project.title}
                    </CardTitle>
                    <Badge
                      variant={project.status === "active" ? "default" : "secondary"}
                    >
                      {project.status === "active" ? "进行中" : "已完成"}
                    </Badge>
                  </div>
                  {project.profile && (
                    <div className="text-sm text-muted-foreground">
                      {project.profile.topic}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.profile && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">
                        {getLevelLabel(project.profile.currentLevel)}
                      </Badge>
                    </div>
                  )}

                  {progress && (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">学习进度</span>
                          <span className="font-medium">{progress.completionRate}%</span>
                        </div>
                        <Progress value={progress.completionRate} />
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          <span>
                            {progress.completedLessons} / {progress.totalLessons} 章节
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatStudyTime(progress.totalStudyTime)}</span>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    {progress?.currentLessonId ? (
                      <Link href={`/lessons/${progress.currentLessonId}`} className="flex-1">
                        <Button className="w-full">
                          <Play className="w-4 h-4 mr-2" />
                          继续学习
                        </Button>
                      </Link>
                    ) : progress?.totalLessons && progress.totalLessons > 0 ? (
                      <Link href={`/lessons/${project.id}`} className="flex-1">
                        <Button className="w-full">
                          <Play className="w-4 h-4 mr-2" />
                          开始学习
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/materials/${project.id}`} className="flex-1">
                        <Button className="w-full">
                          <BookOpen className="w-4 h-4 mr-2" />
                          查看大纲
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">学习统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {projects.length}
              </div>
              <div className="text-sm text-muted-foreground">学习项目</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {Object.values(progressMap).reduce(
                  (sum, p) => sum + p.completedLessons,
                  0
                )}
              </div>
              <div className="text-sm text-muted-foreground">已完成章节</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {Object.values(progressMap).reduce(
                  (sum, p) => sum + p.totalStudyTime,
                  0
                )}
              </div>
              <div className="text-sm text-muted-foreground">学习分钟</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {Math.round(
                  Object.values(progressMap).reduce(
                    (sum, p) => sum + p.completionRate,
                    0
                  ) / (Object.keys(progressMap).length || 1)
                )}
                %
              </div>
              <div className="text-sm text-muted-foreground">平均完成率</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

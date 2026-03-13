"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/upload/FileUpload";
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  Target,
  Clock,
  User,
  Upload,
  FileText,
  ArrowRight,
} from "lucide-react";

interface ProjectData {
  id: string;
  title: string;
  status: string;
  profile?: {
    topic: string;
    goal: string;
    currentLevel: string;
    timeBudget: number;
    learningStyle: string;
    preferences?: {
      background?: string;
      preferences?: string[];
    } | null;
  } | null;
  materials?: Array<{
    id: string;
    filename: string;
    fileType: string;
    parseStatus: string;
  }>;
}

const levelLabels: Record<string, string> = {
  beginner: "零基础入门",
  intermediate: "有一定基础",
  advanced: "进阶学习",
};

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = React.useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [materials, setMaterials] = React.useState<Array<{
    id: string;
    filename: string;
    fileType: string;
    parseStatus: string;
    chunkCount: number;
  }>>([]);

  React.useEffect(() => {
    fetchProject();
    fetchMaterials();
  }, [projectId]);

  async function fetchProject() {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      }
    } catch (error) {
      console.error("Failed to fetch project:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchMaterials() {
    try {
      const response = await fetch(`/api/materials/upload?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      }
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    }
  }

  function handleUploadSuccess(material: { id: string; filename: string }) {
    setMaterials((prev) => [
      {
        id: material.id,
        filename: material.filename,
        fileType: "txt",
        parseStatus: "completed",
        chunkCount: 0,
      },
      ...prev,
    ]);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">项目不存在</p>
            <Button onClick={() => router.push("/learn")}>返回学习中心</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasMaterials = materials.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/learn")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{project.title}</h1>
              <p className="text-sm text-muted-foreground">学习项目</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">学习画像</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.profile && (
                  <>
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">学习主题</p>
                        <p className="font-medium">{project.profile.topic}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">学习目标</p>
                        <p className="font-medium text-sm">{project.profile.goal}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">当前水平</p>
                        <Badge variant="secondary">
                          {levelLabels[project.profile.currentLevel] || project.profile.currentLevel}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">每周学习时间</p>
                        <p className="font-medium">约 {project.profile.timeBudget} 小时</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  上传学习资料
                </CardTitle>
                <CardDescription>
                  上传你的学习资料（支持 TXT、MD 格式），系统将自动解析并生成学习大纲
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload projectId={projectId} onUploadComplete={handleUploadSuccess} />
              </CardContent>
            </Card>

            {hasMaterials && (
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    已上传资料
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {materials.map((material) => (
                      <div
                        key={material.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/30 transition-colors cursor-pointer"
                        onClick={() => router.push(`/materials/${material.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{material.filename}</p>
                            <p className="text-sm text-muted-foreground">
                              {material.parseStatus === "completed" ? "已解析" : "解析中..."}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

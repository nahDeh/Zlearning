import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  Bot, 
  Trophy,
  ArrowRight 
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "智能规划",
    description: "AI 自动拆解知识点，生成个性化学习路径",
    size: "lg",
  },
  {
    icon: TrendingUp,
    title: "实时进度",
    description: "追踪学习进度",
    size: "sm",
  },
  {
    icon: FileText,
    title: "资料解析",
    description: "多格式文档深度语义理解",
    size: "lg",
  },
  {
    icon: CheckCircle,
    title: "练习",
    description: "巩固所学",
    size: "sm",
  },
  {
    icon: Bot,
    title: "7×24 AI 教练",
    description: "随时解答疑问，陪伴学习全程",
    size: "lg",
  },
  {
    icon: Trophy,
    title: "荣誉",
    description: "成就系统",
    size: "sm",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl">智学</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/learn" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              我的学习
            </Link>
            <Link href="/explore" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              探索
            </Link>
          </nav>
          <Button className="gradient-primary text-white border-0">
            开始学习
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="font-heading text-5xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">AI 个性化学习</span>
            <br />
            重塑认知
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            解锁专属于你的高效学习路径。通过 AI 智能分析，将任何学习资料转化为结构化课程，让学习更高效、更有趣。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding">
              <Button size="lg" className="gradient-primary text-white border-0 px-8">
                <Sparkles className="w-4 h-4 mr-2" />
                立即开启学习
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8">
              了解更多
            </Button>
          </div>
        </div>
      </section>

      {/* Bento Features Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isLarge = feature.size === "lg";
              return (
                <Card 
                  key={index}
                  className={`${isLarge ? "md:col-span-2" : ""} glass hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="font-heading">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="gradient-primary text-white border-0">
            <CardContent className="py-12 text-center">
              <h2 className="font-heading text-3xl font-bold mb-4">
                准备好开始你的学习之旅了吗？
              </h2>
              <p className="text-white/80 mb-6 max-w-xl mx-auto">
                只需 3 分钟，AI 就能为你生成专属的学习计划
              </p>
              <Link href="/onboarding">
                <Button size="lg" variant="secondary" className="px-8">
                  立即开始
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2026 智学 AI 学习平台. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

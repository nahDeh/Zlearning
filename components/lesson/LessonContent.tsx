"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LessonExample {
  title: string;
  code?: string;
  explanation: string;
}

interface LessonContentProps {
  objective: string[];
  prerequisites: string[];
  content: string;
  examples: LessonExample[];
  summary: string;
  estimatedMinutes: number | null;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

function simpleMarkdownToHtml(markdown: string): string {
  let html = markdown;

  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>');

  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
  html = html.replace(/`(.*?)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escapedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre class="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm font-mono">${escapedCode}</code></pre>`;
  });

  html = html.replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>');
  html = html.replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>');
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>');

  html = html.replace(/\n\n/g, '</p><p class="my-3">');
  html = `<p class="my-3">${html}</p>`;

  html = html.replace(/<p class="my-3"><h/g, '<h');
  html = html.replace(/<\/h(\d)><\/p>/g, '</h$1>');

  return html;
}

export function LessonContent({
  objective,
  prerequisites,
  content,
  examples,
  summary,
  estimatedMinutes,
  onRegenerate,
  isRegenerating = false,
}: LessonContentProps) {
  const [activeTab, setActiveTab] = useState<"content" | "examples">("content");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">学习目标</CardTitle>
            {estimatedMinutes && (
              <Badge variant="secondary">
                预计 {estimatedMinutes} 分钟
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {objective && objective.length > 0 ? (
            <ul className="space-y-2">
              {objective.map((obj, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">暂无学习目标</p>
          )}
        </CardContent>
      </Card>

      {prerequisites && prerequisites.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">前置知识</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {prerequisites.map((prereq, index) => (
                <li key={index} className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  {prereq}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("content")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "content"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          核心内容
        </button>
        <button
          onClick={() => setActiveTab("examples")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "examples"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          示例 ({examples?.length || 0})
        </button>
      </div>

      {activeTab === "content" && (
        <Card>
          <CardContent className="pt-6">
            {content ? (
              <div
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(content) }}
              />
            ) : (
              <p className="text-muted-foreground">暂无内容</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "examples" && (
        <div className="space-y-4">
          {examples && examples.length > 0 ? (
            examples.map((example, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{example.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {example.code && (
                    <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                      <code className="text-sm font-mono">{example.code}</code>
                    </pre>
                  )}
                  <p className="text-muted-foreground">{example.explanation}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                暂无示例
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {summary && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">本节总结</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{summary}</p>
          </CardContent>
        </Card>
      )}

      {onRegenerate && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={onRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? "重新生成中..." : "重新生成内容"}
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ChatMessage, QuestionOption, QuestionnaireState } from "@/types/questionnaire";
import { Loader2, Sparkles } from "lucide-react";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [state, setState] = React.useState<QuestionnaireState>({
    messages: [],
    currentQuestionIndex: 0,
    answers: {},
    isComplete: false,
    isLoading: true,
  });
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    startQuestionnaire();
  }, []);

  async function startQuestionnaire() {
    try {
      const response = await fetch("/api/questionnaire/start");
      const data = await response.json();

      if (data.success && data.firstQuestion) {
        setState((prev) => ({
          ...prev,
          messages: [data.firstQuestion],
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error("Failed to start questionnaire:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }

  async function handleSendMessage(message: string) {
    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setState((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
    }));

    try {
      const lastAssistantMessage = [...state.messages]
        .reverse()
        .find((m) => m.role === "assistant");

      const response = await fetch("/api/questionnaire/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: lastAssistantMessage?.id || "unknown",
          answer: message,
          conversationHistory: state.messages,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setState((prev) => {
          const newAnswers = { ...prev.answers };
          const questionKeys = ["topic", "goal", "currentLevel", "timeBudget", "learningStyle", "background"];
          if (prev.currentQuestionIndex < questionKeys.length) {
            newAnswers[questionKeys[prev.currentQuestionIndex]] = message;
          }

          return {
            ...prev,
            answers: newAnswers,
            currentQuestionIndex: prev.currentQuestionIndex + 1,
            isComplete: data.isComplete || false,
            messages: data.nextQuestion
              ? [...prev.messages, userMessage, data.nextQuestion]
              : [...prev.messages, userMessage],
            isLoading: false,
          };
        });
      }
    } catch (error) {
      console.error("Failed to send answer:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }

  function handleOptionSelect(option: QuestionOption) {
    handleSendMessage(option.value);
  }

  async function handleComplete() {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/questionnaire/generate-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: state.answers }),
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.setItem("learningProfile", JSON.stringify(data.profile));
        router.push("/onboarding/confirm");
      }
    } catch (error) {
      console.error("Failed to generate profile:", error);
      setIsGenerating(false);
    }
  }

  const progress = Math.min(
    ((state.currentQuestionIndex + 1) / 6) * 100,
    100
  );

  if (state.isLoading && state.messages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">正在初始化学习助手...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold">学习目标设定</h1>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% 完成
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      <main className="flex-1 container max-w-3xl mx-auto px-4 py-6">
        <Card className="h-[calc(100vh-220px)] flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI 学习助手
            </CardTitle>
            <CardDescription>
              回答几个问题，让我为你定制专属学习计划
            </CardDescription>
          </CardHeader>
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              messages={state.messages}
              isLoading={state.isLoading}
              onSendMessage={handleSendMessage}
              onOptionSelect={handleOptionSelect}
            />
          </div>
        </Card>

        {state.isComplete && (
          <div className="mt-4 flex justify-center">
            <Button
              size="lg"
              onClick={handleComplete}
              disabled={isGenerating}
              className="px-8"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  正在生成学习画像...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  生成我的学习画像
                </>
              )}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

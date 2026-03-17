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

const QUESTION_KEYS = ["topic", "goal", "currentLevel", "timeBudget", "learningStyle", "background"];

export default function OnboardingPage() {
  const router = useRouter();
  const [state, setState] = React.useState<QuestionnaireState>({
    messages: [],
    currentQuestionIndex: 0,
    answers: {},
    isComplete: false,
    isLoading: true,
    currentQuestionId: "",
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
          currentQuestionId: data.firstQuestion.id,
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

    const messagesWithUser = [...state.messages, userMessage];

    setState((prev) => ({
      ...prev,
      messages: messagesWithUser,
      isLoading: true,
    }));

    try {
      const response = await fetch("/api/questionnaire/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: state.currentQuestionId,
          answer: message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setState((prev) => {
          const newAnswers = { ...prev.answers };
          if (prev.currentQuestionIndex < QUESTION_KEYS.length) {
            newAnswers[QUESTION_KEYS[prev.currentQuestionIndex]] = message;
          }

          return {
            ...prev,
            answers: newAnswers,
            currentQuestionIndex: prev.currentQuestionIndex + 1,
            isComplete: data.isComplete || false,
            messages: data.nextQuestion
              ? [...prev.messages, data.nextQuestion]
              : prev.messages,
            isLoading: false,
            currentQuestionId: data.nextQuestion?.id || "",
          };
        });
      } else {
        console.error("Answer API error:", data.error);
        setState((prev) => ({ ...prev, isLoading: false }));
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
    ((state.currentQuestionIndex + 1) / QUESTION_KEYS.length) * 100,
    100
  );

  if (state.isLoading && state.messages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-200/50">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
          <p className="text-slate-600 font-medium">正在初始化学习助手...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
      <header className="border-b border-slate-200/60 glass sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-md shadow-cyan-200/50">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-slate-800">学习目标设定</h1>
            </div>
            <span className="text-sm font-medium text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full">
              {Math.round(progress)}% 完成
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-200 [&>div]:bg-gradient-to-r [&>div]:from-cyan-500 [&>div]:to-cyan-600" />
        </div>
      </header>
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-6">
        <Card className="h-[calc(100vh-220px)] flex flex-col glass rounded-2xl shadow-xl border-0">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
              <Sparkles className="h-5 w-5 text-cyan-500" />
              AI 学习助手
            </CardTitle>
            <CardDescription className="text-slate-500">
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
          <div className="mt-6 flex justify-center">
            <Button
              size="lg"
              onClick={handleComplete}
              disabled={isGenerating}
              className="px-8 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 shadow-lg shadow-cyan-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-200/40 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
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

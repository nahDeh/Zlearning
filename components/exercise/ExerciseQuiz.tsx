"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Lightbulb } from "lucide-react";

interface Exercise {
  id: string;
  lessonId: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string | null;
}

interface ExerciseResult {
  id: string;
  exerciseId: string;
  userAnswer: string;
  isCorrect: boolean;
  feedback: string;
  correctAnswer: string;
  explanation: string | null;
}

interface ExerciseQuizProps {
  exercises: Exercise[];
  onComplete?: (results: ExerciseResult[]) => void;
}

export function ExerciseQuiz({ exercises, onComplete }: ExerciseQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedResults, setCompletedResults] = useState<ExerciseResult[]>([]);

  const currentExercise = exercises[currentIndex];
  const isLastExercise = currentIndex === exercises.length - 1;
  const isAllCompleted = currentIndex >= exercises.length;

  const handleSubmit = async () => {
    if (!selectedAnswer || !currentExercise) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/exercises/${currentExercise.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAnswer: selectedAnswer }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.result);
        setSubmitted(true);
        setCompletedResults((prev) => [...prev, data.result]);
      }
    } catch (error) {
      console.error("提交失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (isLastExercise) {
      if (onComplete) {
        onComplete([...completedResults, result!]);
      }
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
      setResult(null);
    }
  };

  const getDifficultyVariant = (difficulty: string | null) => {
    switch (difficulty) {
      case "easy":
        return "success";
      case "medium":
        return "warning";
      case "hard":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getDifficultyLabel = (difficulty: string | null) => {
    switch (difficulty) {
      case "easy":
        return "简单";
      case "medium":
        return "中等";
      case "hard":
        return "困难";
      default:
        return "未知";
    }
  };

  if (exercises.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          暂无练习题
        </CardContent>
      </Card>
    );
  }

  if (isAllCompleted) {
    const correctCount = completedResults.filter((r) => r.isCorrect).length;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center">练习完成！</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-4xl font-bold text-primary mb-4">
            {correctCount} / {exercises.length}
          </div>
          <p className="text-muted-foreground mb-4">
            正确率：{Math.round((correctCount / exercises.length) * 100)}%
          </p>
          <Button onClick={() => {
            setCurrentIndex(0);
            setSelectedAnswer(null);
            setSubmitted(false);
            setResult(null);
            setCompletedResults([]);
          }}>
            重新练习
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            练习题 {currentIndex + 1} / {exercises.length}
          </CardTitle>
          {currentExercise.difficulty && (
            <Badge variant={getDifficultyVariant(currentExercise.difficulty)}>
              {getDifficultyLabel(currentExercise.difficulty)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-lg font-medium">{currentExercise.question}</div>

        <div className="space-y-3">
          {currentExercise.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = submitted && option === currentExercise.correctAnswer;
            const isWrong = submitted && isSelected && !result?.isCorrect;

            return (
              <button
                key={index}
                onClick={() => !submitted && setSelectedAnswer(option)}
                disabled={submitted}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  isCorrect
                    ? "border-green-500 bg-green-50 dark:bg-green-950"
                    : isWrong
                    ? "border-red-500 bg-red-50 dark:bg-red-950"
                    : isSelected
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-accent"
                } ${submitted ? "cursor-default" : "cursor-pointer"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                      isCorrect
                        ? "border-green-500 bg-green-500 text-white"
                        : isWrong
                        ? "border-red-500 bg-red-500 text-white"
                        : isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground"
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isWrong ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      String.fromCharCode(65 + index)
                    )}
                  </div>
                  <span className={isCorrect ? "text-green-700 dark:text-green-300" : isWrong ? "text-red-700 dark:text-red-300" : ""}>
                    {option}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {submitted && result && (
          <div
            className={`p-4 rounded-lg ${
              result.isCorrect
                ? "bg-green-50 dark:bg-green-950 border border-green-200"
                : "bg-red-50 dark:bg-red-950 border border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {result.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <div
                  className={`font-medium ${
                    result.isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {result.isCorrect ? "回答正确！" : "回答错误"}
                </div>
                {result.explanation && (
                  <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                    <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-500" />
                    <span>{result.explanation}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          {!submitted ? (
            <Button
              onClick={handleSubmit}
              disabled={!selectedAnswer || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  提交中...
                </>
              ) : (
                "提交答案"
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              {isLastExercise ? "完成练习" : "下一题"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

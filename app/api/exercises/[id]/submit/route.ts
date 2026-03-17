import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_USER_ID = "default-user";

function parseStringArrayJson(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function parseChoiceIndex(value: string): number | null {
  const text = value.trim();
  const match = text.match(/^(?:选项|Option)?\s*([A-D])(?=$|[\s.\u3001:：)）-])/i);
  if (!match) return null;

  const index = match[1].toUpperCase().charCodeAt(0) - 65;
  return index >= 0 && index <= 3 ? index : null;
}

function stripLeadingChoiceLabel(value: string): string {
  const text = value.trim();
  if (parseChoiceIndex(text) === null) return text;

  return text
    .replace(/^(?:选项|Option)?\s*[A-D](?:[\s.\u3001:：)）-]+)?/i, "")
    .trim();
}

function resolveChoiceIndex(value: string, options: string[]): number | null {
  const answer = value.trim();
  if (!answer) return null;

  const exactIndex = options.findIndex((option) => option.trim() === answer);
  if (exactIndex !== -1) return exactIndex;

  const strippedAnswer = stripLeadingChoiceLabel(answer);
  const strippedIndex = options.findIndex(
    (option) => stripLeadingChoiceLabel(option) === strippedAnswer
  );
  if (strippedIndex !== -1) return strippedIndex;

  const labelIndex = parseChoiceIndex(answer);
  if (labelIndex !== null && labelIndex < options.length) return labelIndex;

  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userAnswer } = body as { userAnswer?: unknown };

    if (typeof userAnswer !== "string" || userAnswer.trim() === "") {
      return NextResponse.json(
        { error: "缺少答案" },
        { status: 400 }
      );
    }

    const exercise = await prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      return NextResponse.json({ error: "练习题不存在" }, { status: 404 });
    }

    const options = parseStringArrayJson(exercise.options);
    const userIndex = resolveChoiceIndex(userAnswer, options);
    const correctIndex = resolveChoiceIndex(exercise.correctAnswer, options);

    const isCorrect =
      userIndex !== null && correctIndex !== null
        ? userIndex === correctIndex
        : userAnswer.trim() === exercise.correctAnswer.trim() ||
          stripLeadingChoiceLabel(userAnswer) === stripLeadingChoiceLabel(exercise.correctAnswer);

    const correctAnswerForClient =
      correctIndex !== null
        ? options[correctIndex] ?? exercise.correctAnswer
        : exercise.correctAnswer;
    const feedback = isCorrect
      ? "回答正确！" + (exercise.explanation ? ` ${exercise.explanation}` : "")
      : `回答错误。正确答案是：${exercise.correctAnswer}` +
        (exercise.explanation ? `。${exercise.explanation}` : "");

    const attempt = await prisma.exerciseAttempt.create({
      data: {
        userId: DEFAULT_USER_ID,
        exerciseId: id,
        userAnswer,
        isCorrect,
        feedback,
      },
    });

    return NextResponse.json({
      success: true,
      result: {
        id: attempt.id,
        exerciseId: exercise.id,
        userAnswer: attempt.userAnswer,
        isCorrect: attempt.isCorrect,
        feedback: attempt.feedback,
        correctAnswer: correctAnswerForClient,
        explanation: exercise.explanation,
      },
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    return NextResponse.json(
      { error: "提交答案失败" },
      { status: 500 }
    );
  }
}

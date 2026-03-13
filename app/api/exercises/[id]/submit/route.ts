import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_USER_ID = "default-user";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userAnswer } = body;

    if (!userAnswer) {
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

    const isCorrect = userAnswer === exercise.correctAnswer;

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
        correctAnswer: exercise.correctAnswer,
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

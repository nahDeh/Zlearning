import { NextRequest, NextResponse } from "next/server";
import { getNextQuestion } from "@/services/ai";
import { AnswerRequest } from "@/types/questionnaire";

export async function POST(request: NextRequest) {
  try {
    const body: AnswerRequest = await request.json();
    const { questionId, answer } = body;

    if (!questionId || !answer) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const result = getNextQuestion(questionId, answer);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing answer:", error);
    return NextResponse.json(
      { success: false, error: "处理答案失败" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getFirstQuestion } from "@/services/ai";

export async function GET() {
  try {
    const firstQuestion = getFirstQuestion();
    return NextResponse.json({
      success: true,
      firstQuestion,
    });
  } catch (error) {
    console.error("Error starting questionnaire:", error);
    return NextResponse.json(
      { success: false, error: "启动问卷失败" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { generateLearningProfile } from "@/services/ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers } = body;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { success: false, error: "缺少答案数据" },
        { status: 400 }
      );
    }

    const profile = await generateLearningProfile(answers);

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Error generating profile:", error);
    return NextResponse.json(
      { success: false, error: "生成学习画像失败" },
      { status: 500 }
    );
  }
}

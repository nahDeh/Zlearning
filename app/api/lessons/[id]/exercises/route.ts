import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

interface GeneratedExercise {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: string;
}

function isMockMode(): boolean {
  return !OPENAI_API_KEY || OPENAI_API_KEY === "";
}

async function generateExercisesWithAI(
  lessonTitle: string,
  lessonContent: string,
  lessonSummary: string,
  count: number = 3
): Promise<GeneratedExercise[]> {
  if (isMockMode()) {
    return generateMockExercises(lessonTitle, count);
  }

  const prompt = `你是一位专业的教育测评专家。请根据以下章节内容生成 ${count} 道选择题练习题。

章节标题: ${lessonTitle}
章节内容摘要: ${lessonSummary || lessonContent.substring(0, 500)}

请生成 ${count} 道选择题，每道题都要有 4 个选项、正确答案和详细解析。

以 JSON 数组格式返回（不要包含任何其他文字）：
[
  {
    "question": "题目内容",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "correctAnswer": "选项A",
    "explanation": "答案解析，解释为什么这个答案是正确的",
    "difficulty": "easy/medium/hard"
  }
]`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "你是一位专业的教育测评专家，擅长设计高质量的选择题。请只返回 JSON 数组格式的结果，不要包含任何其他文字。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status);
      return generateMockExercises(lessonTitle, count);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return generateMockExercises(lessonTitle, count);
    }

    const exercises = JSON.parse(content);
    return exercises.map((e: GeneratedExercise) => ({
      question: e.question || "",
      options: e.options || [],
      correctAnswer: e.correctAnswer || "",
      explanation: e.explanation || "",
      difficulty: e.difficulty || "medium",
    }));
  } catch (error) {
    console.error("Error generating exercises:", error);
    return generateMockExercises(lessonTitle, count);
  }
}

function generateMockExercises(
  lessonTitle: string,
  count: number
): GeneratedExercise[] {
  const exercises: GeneratedExercise[] = [];

  for (let i = 1; i <= count; i++) {
    exercises.push({
      question: `关于 ${lessonTitle}，以下哪个说法是正确的？（练习题 ${i}）`,
      options: [
        "选项 A：这是第一个选项",
        "选项 B：这是第二个选项（正确答案）",
        "选项 C：这是第三个选项",
        "选项 D：这是第四个选项",
      ],
      correctAnswer: "选项 B：这是第二个选项（正确答案）",
      explanation: `这道题考察的是 ${lessonTitle} 的核心概念。选项 B 是正确的，因为它准确描述了相关原理。其他选项存在概念混淆或不完整的问题。`,
      difficulty: i === 1 ? "easy" : i === 2 ? "medium" : "hard",
    });
  }

  return exercises;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const exercises = await prisma.exercise.findMany({
      where: { lessonId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      exercises.map((e) => ({
        id: e.id,
        lessonId: e.lessonId,
        type: e.type,
        question: e.question,
        options: e.options,
        correctAnswer: e.correctAnswer,
        explanation: e.explanation,
        difficulty: e.difficulty,
      }))
    );
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return NextResponse.json(
      { error: "获取练习题失败" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const count = body.count || 3;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      return NextResponse.json({ error: "章节不存在" }, { status: 404 });
    }

    const generatedExercises = await generateExercisesWithAI(
      lesson.title,
      lesson.content || "",
      lesson.summary || "",
      count
    );

    const createdExercises = [];

    for (const exercise of generatedExercises) {
      const created = await prisma.exercise.create({
        data: {
          lessonId: id,
          type: "multiple_choice",
          question: exercise.question,
          options: exercise.options,
          correctAnswer: exercise.correctAnswer,
          explanation: exercise.explanation,
          difficulty: exercise.difficulty,
        },
      });

      createdExercises.push({
        id: created.id,
        lessonId: created.lessonId,
        type: created.type,
        question: created.question,
        options: created.options,
        correctAnswer: created.correctAnswer,
        explanation: created.explanation,
        difficulty: created.difficulty,
      });
    }

    return NextResponse.json({
      success: true,
      count: createdExercises.length,
      exercises: createdExercises,
    });
  } catch (error) {
    console.error("Error generating exercises:", error);
    return NextResponse.json(
      { error: "生成练习题失败" },
      { status: 500 }
    );
  }
}

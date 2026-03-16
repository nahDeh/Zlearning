import {
  ChatMessage,
  QuestionOption,
  LearningProfileDraft,
  AnswerResponse,
} from "@/types/questionnaire";
import { parseJsonFromAi } from "@/services/ai-json";

const AI_API_BASE_URL = process.env.AI_API_BASE_URL || "https://api.openai.com/v1";
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "gpt-4o-mini";

function isMockMode(): boolean {
  return !AI_API_KEY || AI_API_KEY === "";
}

export const QUESTIONS = [
  {
    id: "topic",
    question: "你好！我是你的 AI 学习助手。首先，请告诉我你想学习什么主题？",
    type: "text" as const,
  },
  {
    id: "goal",
    question: "很好！那么你学习这个主题的具体目标是什么呢？比如是为了工作需要、个人兴趣、还是准备考试？",
    type: "text" as const,
  },
  {
    id: "currentLevel",
    question: "了解！你目前对这个主题的了解程度如何？",
    type: "single_choice" as const,
    options: [
      { id: "beginner", text: "完全零基础", value: "beginner" },
      { id: "intermediate", text: "有一些基础", value: "intermediate" },
      { id: "advanced", text: "比较熟悉，想深入学习", value: "advanced" },
    ],
  },
  {
    id: "timeBudget",
    question: "你每周大概可以投入多少时间来学习？",
    type: "single_choice" as const,
    options: [
      { id: "time-1", text: "1-3 小时", value: "2" },
      { id: "time-2", text: "3-5 小时", value: "4" },
      { id: "time-3", text: "5-10 小时", value: "7" },
      { id: "time-4", text: "10 小时以上", value: "12" },
    ],
  },
  {
    id: "learningStyle",
    question: "你更喜欢哪种学习方式？",
    type: "single_choice" as const,
    options: [
      { id: "visual", text: "看图文教程、视频讲解", value: "visual" },
      { id: "practical", text: "动手实践、做项目", value: "practical" },
      { id: "theoretical", text: "阅读理论、深入理解原理", value: "theoretical" },
      { id: "mixed", text: "综合多种方式", value: "mixed" },
    ],
  },
  {
    id: "background",
    question: "最后，请简单介绍一下你的相关背景，比如你的职业、之前的学习经历等，这有助于我为你定制更合适的学习计划。",
    type: "text" as const,
  },
];

export function getFirstQuestion(): ChatMessage {
  const question = QUESTIONS[0];
  return {
    id: question.id,
    role: "assistant",
    content: question.question,
    timestamp: new Date(),
    options: question.options,
  };
}

export function getNextQuestion(
  currentQuestionId: string,
  answer: string
): AnswerResponse {
  const currentIndex = QUESTIONS.findIndex((q) => q.id === currentQuestionId);

  if (currentIndex === -1) {
    return { success: false, error: "无效的问题 ID" };
  }

  const nextIndex = currentIndex + 1;

  if (nextIndex >= QUESTIONS.length) {
    return { success: true, isComplete: true };
  }

  const nextQuestion = QUESTIONS[nextIndex];
  const message: ChatMessage = {
    id: nextQuestion.id,
    role: "assistant",
    content: nextQuestion.question,
    timestamp: new Date(),
    options: nextQuestion.options,
  };

  return { success: true, nextQuestion: message, isComplete: false };
}

export async function generateLearningProfile(
  answers: Record<string, string>
): Promise<LearningProfileDraft> {
  if (isMockMode()) {
    return generateMockProfile(answers);
  }

  const prompt = `根据以下学习者的回答，生成一份学习画像。请以 JSON 格式返回结果。

学习者的回答：
- 学习主题: ${answers.topic || "未提供"}
- 学习目标: ${answers.goal || "未提供"}
- 当前水平: ${answers.currentLevel || "未提供"}
- 每周学习时间: ${answers.timeBudget || "未提供"} 小时
- 学习风格偏好: ${answers.learningStyle || "未提供"}
- 背景: ${answers.background || "未提供"}

请返回以下 JSON 格式（不要包含任何其他文字）：
{
  "topic": "学习主题",
  "goal": "学习目标的详细描述",
  "currentLevel": "beginner/intermediate/advanced",
  "timeBudget": 数字（每周小时数）,
  "learningStyle": "visual/practical/theoretical/mixed",
  "background": "背景描述的总结",
  "preferences": ["偏好1", "偏好2", "偏好3"]
}`;

  try {
    const response = await fetch(`${AI_API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "你是一个专业的学习顾问，擅长根据学习者的回答生成精准的学习画像。请只返回 JSON 格式的结果，不要包含任何其他文字。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return generateMockProfile(answers);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return generateMockProfile(answers);
    }

    const profile = (parseJsonFromAi(content) as any) ?? {};
    return {
      topic: profile.topic || answers.topic || "未知主题",
      goal: profile.goal || answers.goal || "未设定目标",
      currentLevel: profile.currentLevel || "beginner",
      timeBudget: profile.timeBudget || parseInt(answers.timeBudget) || 4,
      learningStyle: profile.learningStyle || "mixed",
      background: profile.background || answers.background || "",
      preferences: profile.preferences || [],
    };
  } catch (error) {
    console.error("Error generating profile:", error);
    return generateMockProfile(answers);
  }
}

export interface RecommendedBook {
  title: string;
  author: string;
  description: string;
  level: "入门" | "进阶" | "高级";
  reason: string;
}

export async function generateRecommendedBooks(
  profile: LearningProfileDraft
): Promise<RecommendedBook[]> {
  if (isMockMode()) {
    return generateMockBooks(profile.topic);
  }

  const prompt = `作为一个专业的学习顾问，请根据以下学习画像推荐 3-5 本最适合的书籍。

学习画像：
- 学习主题: ${profile.topic}
- 学习目标: ${profile.goal}
- 当前水平: ${profile.currentLevel}
- 每周学习时间: ${profile.timeBudget} 小时
- 学习风格: ${profile.learningStyle}
- 背景: ${profile.background || "未提供"}

请推荐真实存在、广受好评的书籍，优先推荐中文书籍或经典英文书籍的中文译本。

以 JSON 数组格式返回（不要包含任何其他文字）：
[
  {
    "title": "书名",
    "author": "作者",
    "description": "书籍简介（一句话）",
    "level": "入门/进阶/高级",
    "reason": "推荐理由"
  }
]`;

  try {
    const response = await fetch(`${AI_API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "你是一个专业的学习顾问，擅长根据学习者的需求推荐最合适的书籍。请只返回 JSON 数组格式的结果，不要包含任何其他文字。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return generateMockBooks(profile.topic);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return generateMockBooks(profile.topic);
    }

    const parsed = parseJsonFromAi(content);
    if (!Array.isArray(parsed)) {
      return generateMockBooks(profile.topic);
    }

    const books = parsed as RecommendedBook[];
    return books.map((book: RecommendedBook) => ({
      title: book.title || "未知书籍",
      author: book.author || "未知作者",
      description: book.description || "",
      level: book.level || "入门",
      reason: book.reason || "",
    }));
  } catch (error) {
    console.error("Error generating book recommendations:", error);
    return generateMockBooks(profile.topic);
  }
}

function generateMockProfile(answers: Record<string, string>): LearningProfileDraft {
  const levelMap: Record<string, "beginner" | "intermediate" | "advanced"> = {
    beginner: "beginner",
    intermediate: "intermediate",
    advanced: "advanced",
  };

  const styleMap: Record<string, "visual" | "practical" | "theoretical" | "mixed"> = {
    visual: "visual",
    practical: "practical",
    theoretical: "theoretical",
    mixed: "mixed",
  };

  return {
    topic: answers.topic || "未指定主题",
    goal: answers.goal || "掌握相关知识技能",
    currentLevel: levelMap[answers.currentLevel] || "beginner",
    timeBudget: parseInt(answers.timeBudget) || 4,
    learningStyle: styleMap[answers.learningStyle] || "mixed",
    background: answers.background || "",
    preferences: [
      "循序渐进的学习路径",
      "结合实际案例讲解",
      "定期复习巩固",
    ],
  };
}

function generateMockBooks(topic: string): RecommendedBook[] {
  return [
    {
      title: `${topic} 入门经典`,
      author: "权威作者",
      description: `最适合初学者的 ${topic} 入门书籍`,
      level: "入门",
      reason: "内容浅显易懂，适合零基础学习者",
    },
    {
      title: `${topic} 实战指南`,
      author: "实战专家",
      description: `通过实际案例学习 ${topic}`,
      level: "进阶",
      reason: "理论与实践结合，适合有一定基础的学习者",
    },
    {
      title: `${topic} 高级教程`,
      author: "资深专家",
      description: `深入探讨 ${topic} 的高级主题`,
      level: "高级",
      reason: "内容深入，适合想要精通的学习者",
    },
  ];
}

export async function generateFollowUpQuestion(
  conversationHistory: ChatMessage[],
  currentAnswer: string
): Promise<ChatMessage | null> {
  if (isMockMode()) {
    return null;
  }

  const messages = [
    {
      role: "system" as const,
      content:
        "你是一个友好的学习助手。根据对话历史和用户的最新回答，判断是否需要追问来更好地了解学习者的需求。如果需要追问，返回一个简短的问题；如果不需要，返回 'NO_FOLLOW_UP'。",
    },
    ...conversationHistory.map((msg) => ({
      role: msg.role as "assistant" | "user",
      content: msg.content,
    })),
    { role: "user" as const, content: currentAnswer },
  ];

  try {
    const response = await fetch(`${AI_API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content || content === "NO_FOLLOW_UP") {
      return null;
    }

    return {
      id: `followup-${Date.now()}`,
      role: "assistant",
      content,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Error generating follow-up:", error);
    return null;
  }
}

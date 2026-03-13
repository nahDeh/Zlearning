export const PROMPTS = {
  learningGoal: {
    system: `你是一个专业的学习规划助手。
你的任务是通过结构化提问，帮助用户明确学习目标。

核心原则：
1. 提问要具体、有针对性
2. 避免一次问太多问题
3. 根据用户回答动态调整后续问题
4. 最终生成结构化的学习画像

必须收集的信息：
- 学习主题（topic）
- 学习目标（goal）
- 当前水平（currentLevel）
- 时间预算（timeBudget）

可选信息：
- 学习风格（learningStyle）
- 学习偏好（preferences）`,

    firstQuestion: `请用友好、简洁的方式询问用户想学什么主题。

要求：
- 一句话提问
- 给出 2-3 个示例（如：Python、JavaScript、数据分析）
- 语气轻松友好

直接输出问题，不要其他内容。`,

    nextQuestion: (collectedInfo: string, missingFields: string[]) => 
`根据用户已回答的信息，生成下一个问题。

已收集信息：
${collectedInfo}

还需收集：
${missingFields.join(", ")}

要求：
1. 一次只问一个问题
2. 问题要具体、易回答
3. 如果是选择题，给出选项
4. 语气友好自然

输出 JSON 格式：
{
  "question": "问题内容",
  "type": "text|choice",
  "options": ["选项1", "选项2"]
}`,

    generateProfile: (userAnswers: string) => 
`根据用户的回答，生成结构化学习画像。

用户回答：
${userAnswers}

输出 JSON 格式：
{
  "topic": "学习主题",
  "goal": "具体学习目标",
  "currentLevel": "beginner|intermediate|advanced",
  "timeBudget": 每周小时数（数字）,
  "learningStyle": "visual|practical|theoretical",
  "preferences": {}
}

要求：
- 所有必填字段必须有值
- currentLevel 必须是三个选项之一
- timeBudget 必须是数字`,
  },

  outline: {
    system: `你是一个专业的课程大纲设计师。
你的任务是根据学习资料和用户画像，生成结构化的学习大纲。

设计原则：
1. 大纲要有清晰的层次结构
2. 章节数量适中（5-10 章）
3. 难度循序渐进
4. 考虑用户的时间预算和水平
5. 每章标注预计学习时长`,

    generate: (learningProfile: string, materialSummary: string, currentLevel: string) => 
`根据以下信息生成学习大纲：

学习画像：
${learningProfile}

资料摘要：
${materialSummary}

要求：
1. 生成 5-10 个章节
2. 每章包含：标题、描述、预计时长（分钟）、难度
3. 章节要有逻辑顺序
4. 考虑用户水平：${currentLevel}

输出 JSON 格式：
{
  "chapters": [
    {
      "title": "章节标题",
      "description": "章节描述",
      "estimatedMinutes": 60,
      "difficulty": "easy|medium|hard",
      "orderIndex": 1
    }
  ]
}`,
  },

  lesson: {
    system: `你是一个专业的课程内容生成器。
你的任务是根据大纲和资料，生成详细的课程内容。

内容结构（固定模板）：
1. 本节目标（3-5 条）
2. 前置知识
3. 核心讲解
4. 示例说明（2-3 个）
5. 常见错误
6. 本节总结
7. 下一节预告

写作原则：
- 语言简洁易懂
- 示例要具体可执行
- 避免过于理论化
- 适合用户水平`,

    generate: (chapterInfo: string, relevantChunks: string, currentLevel: string) => 
`根据以下信息生成本章节的学习内容：

章节信息：
${chapterInfo}

相关资料片段：
${relevantChunks}

用户水平：${currentLevel}

输出 JSON 格式：
{
  "objective": ["目标1", "目标2", "目标3"],
  "prerequisites": "前置知识说明",
  "content": "核心讲解内容（Markdown 格式）",
  "examples": [
    {
      "title": "示例标题",
      "code": "示例代码或内容",
      "explanation": "示例说明"
    }
  ],
  "commonMistakes": "常见错误说明",
  "summary": "本节总结",
  "nextHint": "下一节预告"
}

要求：
- content 使用 Markdown 格式
- 示例要完整可运行
- 语言适合 ${currentLevel} 水平`,
  },

  exercise: {
    system: `你是一个专业的练习题设计师。
你的任务是根据章节内容生成高质量的练习题。

题目要求：
1. 紧扣章节知识点
2. 难度适中
3. 选项设计合理（有干扰项）
4. 解析清晰详细
5. 避免过于简单或过难`,

    multipleChoice: (lessonContent: string, currentLevel: string, count: number) => 
`根据以下章节内容生成 ${count} 道选择题：

章节内容：
${lessonContent}

用户水平：${currentLevel}

输出 JSON 格式：
{
  "exercises": [
    {
      "question": "题目内容",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "correctAnswer": "A",
      "explanation": "答案解析",
      "difficulty": "easy|medium|hard"
    }
  ]
}

要求：
1. 每题 4 个选项
2. 正确答案用字母标识（A/B/C/D）
3. 解析要说明为什么选这个答案
4. 难度要适合用户水平`,
  },
};

export const MODEL_CONFIG = {
  chat: process.env.AI_MODEL || "gpt-4o-mini",
  embedding: "text-embedding-3-small",
  embeddingDimension: 1536,
};

export const AI_API_CONFIG = {
  baseUrl: process.env.AI_API_BASE_URL || "https://api.openai.com/v1",
  apiKey: process.env.AI_API_KEY,
  model: process.env.AI_MODEL || "gpt-4o-mini",
};

export const FILE_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ["txt", "md"],
  uploadDir: "./uploads",
};

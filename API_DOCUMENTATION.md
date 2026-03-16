# 智学 AI 学习平台 API 接口文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`（文件上传接口为 `multipart/form-data`）
- **认证方式**: 当前版本使用默认用户（无认证）
- **Mock 模式**: 未配置 `AI_API_KEY` 时，AI 相关接口返回模拟数据

***

## 目录

1. [系统状态](#1-系统状态)
2. [项目管理](#2-项目管理)
3. [学习画像问答](#3-学习画像问答)
4. [资料上传与解析](#4-资料上传与解析)
5. [大纲管理](#5-大纲管理)
6. [课程生成](#6-课程生成)
7. [章节学习](#7-章节学习)
8. [练习题](#8-练习题)
9. [学习进度](#9-学习进度)

***

## 1. 系统状态

### GET /api

获取 API 服务状态。

**请求示例**:

```bash
GET /api
```

**响应示例**:

```json
{
  "status": "ok",
  "message": "智学 API 服务运行中",
  "version": "1.0.0"
}
```

***

## 2. 项目管理

### GET /api/projects

获取所有学习项目列表。

**请求示例**:

```bash
GET /api/projects
```

**响应示例**:

```json
{
  "success": true,
  "projects": [
    {
      "id": "clx123...",
      "title": "Python 入门学习",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "profile": {
        "topic": "Python",
        "goal": "掌握 Python 基础语法",
        "currentLevel": "beginner"
      }
    }
  ]
}
```

### GET /api/projects/:id

获取单个学习项目详情（包含学习画像与资料概览）。

**路径参数**:

| 参数 | 类型     | 说明    |
| -- | ------ | ----- |
| id | string | 项目 ID |

**请求示例**:

```bash
GET /api/projects/clx123...
```

**响应示例**:

```json
{
  "success": true,
  "project": {
    "id": "clx123...",
    "title": "Python 入门学习",
    "status": "active",
    "profile": {
      "topic": "Python",
      "goal": "掌握 Python 基础语法",
      "currentLevel": "beginner",
      "timeBudget": 4,
      "learningStyle": "mixed",
      "preferences": {
        "background": "",
        "preferences": []
      }
    },
    "materials": [
      {
        "id": "clx789...",
        "filename": "learning.pdf",
        "fileType": "pdf",
        "parseStatus": "completed"
      }
    ]
  }
}
```

### POST /api/projects

创建新的学习项目。

**请求体**:

```json
{
  "title": "Python 入门学习",
  "profile": {
    "topic": "Python 编程",
    "goal": "掌握 Python 基础语法，能够编写简单程序",
    "currentLevel": "beginner",
    "timeBudget": 10,
    "learningStyle": "practical",
    "background": "有一点编程基础",
    "preferences": ["项目驱动", "例子多一些"]
  }
}
```

**响应示例**:

```json
{
  "success": true,
  "projectId": "clx123...",
  "project": {
    "id": "clx123...",
    "title": "Python 入门学习",
    "status": "active",
    "profile": {
      "topic": "Python 编程",
      "goal": "掌握 Python 基础语法，能够编写简单程序",
      "currentLevel": "beginner",
      "timeBudget": 10,
      "learningStyle": "practical",
      "preferences": {
        "background": "有一点编程基础",
        "preferences": ["项目驱动", "例子多一些"]
      }
    }
  }
}
```

***

## 3. 学习画像问答

> 说明：该组接口用于生成“学习画像草稿”。如需落库并创建项目，请调用 `POST /api/projects`。

### GET /api/questionnaire/start

开始学习画像问答会话。

**响应示例**:

```json
{
  "success": true,
  "firstQuestion": {
    "id": "topic",
    "role": "assistant",
    "content": "你好！我是你的 AI 学习助手。首先，请告诉我你想学习什么主题？",
    "timestamp": "2026-03-16T00:00:00.000Z"
  }
}
```

### POST /api/questionnaire/answer

提交问题答案。

**请求体**:

```json
{
  "questionId": "topic",
  "answer": "Python 编程"
}
```

**响应示例**:

```json
{
  "success": true,
  "nextQuestion": {
    "id": "goal",
    "role": "assistant",
    "content": "很好！那么你学习这个主题的具体目标是什么呢？比如是为了工作需要、个人兴趣、还是准备考试？",
    "timestamp": "2026-03-16T00:00:00.000Z"
  },
  "isComplete": false
}
```

### POST /api/questionnaire/generate-profile

生成学习画像。

**请求体**:

```json
{
  "answers": {
    "topic": "Python 编程",
    "goal": "掌握 Python 基础语法",
    "currentLevel": "beginner",
    "timeBudget": "4",
    "learningStyle": "practical",
    "background": "我是产品经理，想提升自动化能力"
  }
}
```

**响应示例**:

```json
{
  "success": true,
  "profile": {
    "topic": "Python 编程",
    "goal": "掌握基础语法，能够编写简单程序",
    "currentLevel": "beginner",
    "timeBudget": 4,
    "learningStyle": "practical",
    "background": "你具备一定的业务背景，希望通过 Python 提升自动化效率。",
    "preferences": ["项目驱动", "例子多一些"]
  }
}
```

***

## 4. 资料上传与解析

### POST /api/materials/upload

上传学习资料文件。

**请求**:

- Content-Type: `multipart/form-data`

**FormData 字段**:

| 字段        | 类型     | 必填 | 说明                   |
| --------- | ------ | -- | -------------------- |
| file      | File   | 是  | 上传的文件（支持 txt、md、pdf、epub） |
| projectId | string | 是  | 项目 ID                |

**请求示例**:

```bash
curl -X POST http://localhost:3000/api/materials/upload \
  -F "file=@learning.txt" \
  -F "projectId=clx123..."
```

**响应示例**:

```json
{
  "success": true,
  "material": {
    "id": "clx789...",
    "filename": "learning.txt",
    "fileType": "txt",
    "fileSize": 1024,
    "parseStatus": "completed",
    "metadata": {
      "wordCount": 800,
      "charCount": 5000,
      "pageCount": 12,
      "title": "示例标题",
      "author": "示例作者"
    },
    "chunkCount": 5
  }
}
```

### GET /api/materials/upload

获取项目的资料列表。

**查询参数**:

| 参数        | 类型     | 必填 | 说明    |
| --------- | ------ | -- | ----- |
| projectId | string | 是  | 项目 ID |

**请求示例**:

```bash
GET /api/materials/upload?projectId=clx123...
```

**响应示例**:

```json
{
  "success": true,
  "materials": [
    {
      "id": "clx789...",
      "filename": "learning.txt",
      "fileType": "txt",
      "fileSize": 1024,
      "parseStatus": "completed",
      "chunkCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

***

## 5. 大纲管理

### POST /api/materials/:id/outline

根据资料生成学习大纲。

**路径参数**:

| 参数 | 类型     | 说明    |
| -- | ------ | ----- |
| id | string | 资料 ID |

**请求体**:

```json
{
  "regenerate": false
}
```

**响应示例**:

```json
{
  "success": true,
  "outline": {
    "id": "clxabc...",
    "chapters": [
      {
        "title": "基础概念入门",
        "description": "了解核心概念和基本术语",
        "estimatedMinutes": 30,
        "difficulty": "easy",
        "orderIndex": 0
      },
      {
        "title": "核心原理深入",
        "description": "深入理解核心原理和关键机制",
        "estimatedMinutes": 45,
        "difficulty": "medium",
        "orderIndex": 1
      }
    ],
    "version": 1
  }
}
```

### GET /api/outlines/:id

获取大纲详情。

**路径参数**:

| 参数 | 类型     | 说明    |
| -- | ------ | ----- |
| id | string | 大纲 ID |

**响应示例**:

```json
{
  "success": true,
  "outline": {
    "id": "clxabc...",
    "projectId": "clx123...",
    "version": 1,
    "content": [
      {
        "title": "基础概念入门",
        "description": "了解核心概念和基本术语",
        "estimatedMinutes": 30,
        "difficulty": "easy",
        "orderIndex": 0
      }
    ],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "project": {
      "id": "clx123...",
      "title": "Python 入门学习",
      "profile": {
        "topic": "Python",
        "goal": "掌握基础语法"
      }
    }
  }
}
```

### PUT /api/outlines/:id

更新大纲内容（编辑章节）。

**请求体**:

```json
{
  "chapters": [
    {
      "title": "第一章：入门",
      "description": "基础入门知识",
      "estimatedMinutes": 30,
      "difficulty": "easy"
    },
    {
      "title": "第二章：进阶",
      "description": "进阶知识",
      "estimatedMinutes": 45,
      "difficulty": "medium"
    }
  ]
}
```

**响应示例**:

```json
{
  "success": true,
  "outline": {
    "id": "clxabc...",
    "projectId": "clx123...",
    "version": 1,
    "content": [...],
    "isActive": true
  }
}
```

### DELETE /api/outlines/:id

删除大纲。

**响应示例**:

```json
{
  "success": true,
  "message": "大纲已删除"
}
```

***

## 6. 课程生成

### POST /api/courses/generate

根据大纲生成所有章节内容。

**请求体**:

```json
{
  "outlineId": "clxabc..."
}
```

**响应示例**:

```json
{
  "success": true,
  "outlineId": "clxabc...",
  "projectId": "clx123...",
  "lessonCount": 5,
  "lessons": [
    {
      "id": "clxdef...",
      "title": "基础概念入门",
      "orderIndex": 0
    },
    {
      "id": "clxghi...",
      "title": "核心原理深入",
      "orderIndex": 1
    }
  ]
}
```

***

## 7. 章节学习

### GET /api/lessons/:id

获取章节详情。

**路径参数**:

| 参数 | 类型     | 说明    |
| -- | ------ | ----- |
| id | string | 章节 ID |

**响应示例**:

```json
{
  "id": "clxdef...",
  "outlineId": "clxabc...",
  "title": "基础概念入门",
  "orderIndex": 0,
  "objective": [
    "理解核心概念",
    "掌握基本操作",
    "能够解决实际问题"
  ],
  "prerequisites": ["基础知识", "基本概念理解"],
  "content": "## 基础概念入门\n\n本章节将介绍...",
  "examples": [
    {
      "title": "基础示例",
      "code": "console.log('Hello');",
      "explanation": "这是一个基础示例"
    }
  ],
  "summary": "本章节介绍了核心概念...",
  "estimatedMinutes": 30,
  "outline": {
    "id": "clxabc...",
    "projectId": "clx123...",
    "lessons": [
      { "id": "clxdef...", "title": "基础概念入门", "orderIndex": 0 },
      { "id": "clxghi...", "title": "核心原理深入", "orderIndex": 1 }
    ]
  }
}
```

### POST /api/lessons/:id/generate

重新生成单个章节内容。

**路径参数**:

| 参数 | 类型     | 说明    |
| -- | ------ | ----- |
| id | string | 章节 ID |

**响应示例**:

```json
{
  "success": true,
  "lesson": {
    "id": "clxdef...",
    "title": "基础概念入门",
    "objective": [...],
    "content": "...",
    "summary": "..."
  }
}
```

***

## 8. 练习题

### GET /api/lessons/:id/exercises

获取章节的练习题列表。

**路径参数**:

| 参数 | 类型     | 说明    |
| -- | ------ | ----- |
| id | string | 章节 ID |

**响应示例**:

```json
[
  {
    "id": "clxex1...",
    "lessonId": "clxdef...",
    "type": "multiple_choice",
    "question": "关于基础概念，以下哪个说法是正确的？",
    "options": [
      "选项 A：第一个选项",
      "选项 B：第二个选项（正确答案）",
      "选项 C：第三个选项",
      "选项 D：第四个选项"
    ],
    "explanation": "这道题考察的是核心概念...",
    "difficulty": "easy"
  }
]
```

### POST /api/lessons/:id/exercises

为章节生成练习题。

**路径参数**:

| 参数 | 类型     | 说明    |
| -- | ------ | ----- |
| id | string | 章节 ID |

**请求体**:

```json
{
  "count": 3
}
```

**响应示例**:

```json
{
  "success": true,
  "count": 3,
  "exercises": [
    {
      "id": "clxex1...",
      "lessonId": "clxdef...",
      "type": "multiple_choice",
      "question": "问题内容",
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "correctAnswer": "选项B",
      "explanation": "答案解析",
      "difficulty": "easy"
    }
  ]
}
```

### POST /api/exercises/:id/submit

提交练习题答案。

**路径参数**:

| 参数 | 类型     | 说明     |
| -- | ------ | ------ |
| id | string | 练习题 ID |

**请求体**:

```json
{
  "userAnswer": "选项 B：第二个选项（正确答案）"
}
```

**响应示例**:

```json
{
  "success": true,
  "result": {
    "id": "clxatt...",
    "exerciseId": "clxex1...",
    "userAnswer": "选项 B：第二个选项（正确答案）",
    "isCorrect": true,
    "feedback": "回答正确！这道题考察的是核心概念...",
    "correctAnswer": "选项 B：第二个选项（正确答案）",
    "explanation": "这道题考察的是核心概念..."
  }
}
```

***

## 9. 学习进度

### GET /api/progress

获取学习进度统计。

**查询参数**:

| 参数        | 类型     | 必填 | 说明    |
| --------- | ------ | -- | ----- |
| projectId | string | 是  | 项目 ID |

**请求示例**:

```bash
GET /api/progress?projectId=clx123...
```

**响应示例**:

```json
{
  "projectId": "clx123...",
  "totalLessons": 5,
  "completedLessons": 2,
  "completionRate": 40,
  "totalStudyTime": 45,
  "currentLessonId": "clxghi..."
}
```

### POST /api/progress

更新学习进度。

**请求体**:

```json
{
  "lessonId": "clxdef...",
  "projectId": "clx123...",
  "status": "completed",
  "studyTime": 30
}
```

**响应示例**:

```json
{
  "success": true,
  "record": {
    "id": "clxrec...",
    "lessonId": "clxdef...",
    "status": "completed",
    "studyTime": 30,
    "completedAt": "2024-01-01T01:00:00.000Z"
  }
}
```

***

## 错误响应格式

所有 API 在发生错误时返回统一格式：

```json
{
  "error": "错误信息描述"
}
```

**常见 HTTP 状态码**:

| 状态码 | 说明      |
| --- | ------- |
| 200 | 成功      |
| 400 | 请求参数错误  |
| 404 | 资源不存在   |
| 500 | 服务器内部错误 |

***

## 环境变量

| 变量名               | 必填 | 说明                                           |
| ----------------- | -- | -------------------------------------------- |
| `DATABASE_URL`    | 是  | Prisma 数据库连接字符串（默认 SQLite；也可配置 PostgreSQL） |
| `AI_API_BASE_URL` | 否  | AI API 基础 URL，默认 `https://api.openai.com/v1` |
| `AI_API_KEY`      | 否  | AI API 密钥（不配置则使用 Mock 模式）                    |
| `AI_MODEL`        | 否  | AI 模型名称，默认 `gpt-4o-mini`                     |
| `UPLOAD_DIR`      | 否  | 文件上传目录，默认 `./uploads`                        |
| `MAX_FILE_SIZE`   | 否  | 最大文件大小，默认 `52428800`（50MB）                   |

### AI API 配置示例

**使用 OpenAI**:

```bash
AI_API_BASE_URL="https://api.openai.com/v1"
AI_API_KEY="sk-..."
AI_MODEL="gpt-4o-mini"
```

**使用硅基流动**:

```bash
AI_API_BASE_URL="https://api.siliconflow.cn/v1"
AI_API_KEY="sk-..."
AI_MODEL="Qwen/Qwen2.5-7B-Instruct"
```

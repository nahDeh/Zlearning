# 智学 AI 学习平台 API 接口文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`
- **认证方式**: 当前版本使用默认用户（无认证）

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

### POST /api/projects

创建新的学习项目。

**请求体**:

```json
{
  "title": "Python 入门学习",
  "topic": "Python 编程",
  "goal": "掌握 Python 基础语法，能够编写简单程序",
  "currentLevel": "beginner",
  "timeBudget": 10,
  "learningStyle": "practical"
}
```

**响应示例**:

```json
{
  "success": true,
  "project": {
    "id": "clx123...",
    "title": "Python 入门学习",
    "status": "active"
  },
  "profile": {
    "id": "clx456...",
    "topic": "Python 编程",
    "goal": "掌握 Python 基础语法，能够编写简单程序",
    "currentLevel": "beginner",
    "timeBudget": 10,
    "learningStyle": "practical"
  }
}
```

***

## 3. 学习画像问答

### POST /api/questionnaire/start

开始学习画像问答会话。

**请求体**:

```json
{
  "projectId": "clx123..."
}
```

**响应示例**:

```json
{
  "success": true,
  "question": {
    "id": "q1",
    "text": "你想学习什么主题？例如：Python、JavaScript、数据分析等",
    "type": "text",
    "field": "topic"
  },
  "progress": {
    "current": 1,
    "total": 6
  }
}
```

### POST /api/questionnaire/answer

提交问题答案。

**请求体**:

```json
{
  "projectId": "clx123...",
  "questionId": "q1",
  "answer": "Python 编程"
}
```

**响应示例**:

```json
{
  "success": true,
  "nextQuestion": {
    "id": "q2",
    "text": "你的学习目标是什么？",
    "type": "text",
    "field": "goal"
  },
  "progress": {
    "current": 2,
    "total": 6
  },
  "isComplete": false
}
```

### POST /api/questionnaire/generate-profile

生成学习画像。

**请求体**:

```json
{
  "projectId": "clx123..."
}
```

**响应示例**:

```json
{
  "success": true,
  "profile": {
    "id": "clx456...",
    "projectId": "clx123...",
    "topic": "Python 编程",
    "goal": "掌握基础语法，能够编写简单程序",
    "currentLevel": "beginner",
    "timeBudget": 10,
    "learningStyle": "practical",
    "preferences": {}
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
| file      | File   | 是  | 上传的文件（支持 txt、md、pdf） |
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
      "totalChars": 5000,
      "totalWords": 800
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
    "correctAnswer": "选项 B：第二个选项（正确答案）",
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
| `DATABASE_URL`    | 是  | PostgreSQL 数据库连接字符串                          |
| `AI_API_BASE_URL` | 否  | AI API 基础 URL，默认 `https://api.openai.com/v1` |
| `AI_API_KEY`      | 否  | AI API 密钥（不配置则使用 Mock 模式）                    |
| `AI_MODEL`        | 否  | AI 模型名称，默认 `gpt-4o-mini`                     |
| `UPLOAD_DIR`      | 否  | 文件上传目录，默认 `./uploads`                        |
| `MAX_FILE_SIZE`   | 否  | 最大文件大小，默认 `10485760`（10MB）                   |

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


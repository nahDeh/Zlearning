# 智学 AI 学习平台 MVP Spec

## Why

用户在学习过程中面临以下痛点：不知道该学什么、不知道从哪里开始、有资料但不会整理、学习过程容易中断、学完后不知道下一步该学什么。本项目旨在构建一个 AI 个性化学习教练，通过结构化问答确定学习目标，自动解析资料生成课程路径，帮助用户完成持续、自适应的学习闭环。

## What Changes

- 创建 Next.js 14+ 全栈项目框架
- 实现学习目标问答模块（AI 结构化提问）
- 实现资料上传与解析模块（支持 TXT/MD）
- 实现学习大纲生成模块（基于 RAG）
- 实现课程内容生成模块（固定模板）
- 实现章节学习页面（断点续学）
- 实现练习题模块（选择题）
- 实现学习进度管理模块
- 设计并实现数据库 Schema（PostgreSQL + pgvector）
- 配置 AI Prompt 模板库

## Impact

- Affected specs: 新项目初始化
- Affected code: 全新代码库

## ADDED Requirements

### Requirement: 项目初始化
系统 SHALL 使用 Next.js 14+ 创建全栈项目，配置 TypeScript、Tailwind CSS、shadcn/ui 组件库。

#### Scenario: 项目创建成功
- **WHEN** 执行项目初始化
- **THEN** 项目结构符合规范，包含 app、components、lib、services 等目录

### Requirement: 数据库设计
系统 SHALL 使用 PostgreSQL + pgvector 存储数据，通过 Prisma ORM 进行数据操作。

#### Scenario: 数据库连接成功
- **WHEN** 配置 DATABASE_URL 环境变量
- **THEN** Prisma 可成功连接数据库并执行迁移

#### Scenario: 向量存储可用
- **WHEN** 启用 pgvector 扩展
- **THEN** MaterialChunk 表支持 vector(1536) 类型存储

### Requirement: 学习目标问答模块
系统 SHALL 通过 AI 结构化提问收集用户学习需求，生成学习画像。

#### Scenario: 收集必填信息
- **WHEN** 用户开始学习建档
- **THEN** 系统通过 AI 对话收集：学习主题、学习目标、当前水平、时间预算

#### Scenario: 生成学习画像
- **WHEN** 必填信息收集完成
- **THEN** 系统生成 JSON 格式的学习画像并保存到数据库

### Requirement: 资料上传与解析模块
系统 SHALL 支持用户上传 TXT/MD 文件，自动提取文本内容。

#### Scenario: 文件上传成功
- **WHEN** 用户上传 TXT 或 MD 文件（≤10MB）
- **THEN** 系统保存文件并记录到 materials 表

#### Scenario: 文本提取成功
- **WHEN** 文件上传完成
- **THEN** 系统提取文本内容存储到 extractedText 字段

#### Scenario: 文件解析失败
- **WHEN** 文件解析失败
- **THEN** 系统显示明确错误提示并提供重新上传选项

### Requirement: 学习大纲生成模块
系统 SHALL 根据上传资料和学习画像，生成结构化学习大纲。

#### Scenario: 大纲生成成功
- **WHEN** 资料解析完成且有学习画像
- **THEN** 系统生成 5-10 个章节的学习大纲

#### Scenario: 大纲内容完整
- **WHEN** 大纲生成完成
- **THEN** 每章包含：标题、描述、预计时长、难度、顺序索引

#### Scenario: RAG 检索增强
- **WHEN** 生成大纲时
- **THEN** 系统通过向量检索获取相关资料片段辅助生成

### Requirement: 课程内容生成模块
系统 SHALL 根据大纲和资料，按章节生成学习内容。

#### Scenario: 章节内容生成成功
- **WHEN** 用户进入某章节
- **THEN** 系统生成包含目标、讲解、示例、总结的结构化内容

#### Scenario: 内容模板完整
- **WHEN** 章节内容生成完成
- **THEN** 内容包含：objective、prerequisites、content、examples、commonMistakes、summary、nextHint

### Requirement: 章节学习模块
系统 SHALL 提供章节学习页面，支持断点续学。

#### Scenario: 显示章节列表
- **WHEN** 用户进入学习中心
- **THEN** 显示所有章节及完成状态

#### Scenario: 断点续学
- **WHEN** 用户重新进入学习
- **THEN** 系统自动跳转到上次学习位置

#### Scenario: 标记章节完成
- **WHEN** 用户完成章节学习
- **THEN** 系统更新学习记录状态为 completed

### Requirement: 练习题模块
系统 SHALL 为每章节生成 2-3 道选择题。

#### Scenario: 练习题生成成功
- **WHEN** 章节内容生成完成
- **THEN** 系统生成 2-3 道选择题

#### Scenario: 答题反馈
- **WHEN** 用户提交答案
- **THEN** 系统显示正确答案和解析

### Requirement: 学习进度管理模块
系统 SHALL 记录和展示学习进度。

#### Scenario: 进度显示
- **WHEN** 用户查看学习中心
- **THEN** 显示已完成章节数、总章节数、完成百分比

#### Scenario: 学习时长记录
- **WHEN** 用户学习章节
- **THEN** 系统记录学习时长

## MODIFIED Requirements

无（新项目）

## REMOVED Requirements

无（新项目）

---

## 技术架构

### 前端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 14+ | 全栈框架 |
| React | 18+ | UI 框架 |
| TypeScript | 5+ | 类型系统 |
| Tailwind CSS | 3+ | 样式框架 |
| shadcn/ui | latest | 组件库 |
| Zustand | latest | 状态管理 |

### 后端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js API Routes | 14+ | API 服务 |
| Prisma | 5+ | ORM |
| PostgreSQL | 15+ | 关系数据库 |
| pgvector | latest | 向量存储 |
| Zod | latest | 数据验证 |

### AI 技术栈
| 技术 | 用途 |
|------|------|
| OpenAI API | LLM 调用 |
| LangChain | AI 编排 |
| text-embedding-3-small | 文本向量化 |
| gpt-4o-mini | 课程生成 |

---

## 数据模型

### User（用户）
- id, username, email, createdAt, updatedAt

### LearningProject（学习项目）
- id, userId, title, status, currentLessonId, createdAt, updatedAt

### LearningProfile（学习画像）
- id, projectId, topic, goal, currentLevel, timeBudget, learningStyle, preferences

### Material（学习资料）
- id, projectId, filename, fileType, filePath, fileSize, parseStatus, extractedText, metadata

### MaterialChunk（资料分块）
- id, materialId, chunkText, chunkIndex, embedding, metadata

### Outline（学习大纲）
- id, projectId, version, content, isActive

### Lesson（课程章节）
- id, outlineId, title, orderIndex, objective, prerequisites, content, examples, summary, estimatedMinutes

### Exercise（练习题）
- id, lessonId, type, question, options, correctAnswer, explanation, difficulty

### StudyRecord（学习记录）
- id, userId, lessonId, status, studyTime, completedAt

### ExerciseAttempt（答题记录）
- id, userId, exerciseId, userAnswer, isCorrect, feedback

---

## 页面结构

1. **首页** - 展示产品价值，引导创建学习项目
2. **学习建档页** - AI 对话收集学习目标
3. **资料推荐页** - 推荐资料类型和资源
4. **资料上传页** - 上传文件、解析结果、大纲确认
5. **学习中心** - 章节目录、进度、进入课程
6. **章节学习页** - 课程内容、练习、反馈

---

## 设计规范

### Quantum Scholar 设计语言
- **布局风格**：BENTO Grid（非对称网格）
- **视觉效果**：玻璃拟态（Glassmorphism）
- **主色调**：Indigo (#4F46E5) + Cyan (#06B6D4) 渐变
- **字体**：Outfit（标题）+ Inter（正文）
- **按钮交互**：scale-95 点击反馈, shadow-lg 悬浮反馈

---

## 质量门槛

### 北极星门槛
用户上传资料后，系统生成的大纲是否让他愿意立刻开始第一节。

### 过线标准
- 用户能独立走完整条学习主链路
- 大纲输出达到"愿意开始第一节"的程度
- 单节内容达到"可学而非摘要"的程度
- AI 失败时产品仍然可以继续推进

### 系统级红线
- 用户无法独立完成主链路
- 上传资料后结果与原文关系很弱
- 大纲严重重复、跳跃、空泛
- 单节内容明显跑题
- 练习题答案或反馈明显不可信
- 失败时没有替代路径

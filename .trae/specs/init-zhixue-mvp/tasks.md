# Tasks

## Phase 1: 项目初始化与基础架构

- [x] Task 1: 创建 Next.js 项目并配置基础框架
  - [x] SubTask 1.1: 使用 create-next-app 创建项目，配置 TypeScript、Tailwind CSS、ESLint
  - [x] SubTask 1.2: 安装并配置 shadcn/ui 组件库
  - [x] SubTask 1.3: 创建项目目录结构（app、components、lib、services、types）
  - [x] SubTask 1.4: 配置环境变量模板（.env.example）

- [x] Task 2: 配置数据库与 Prisma
  - [x] SubTask 2.1: 安装 Prisma 并初始化
  - [x] SubTask 2.2: 编写 Prisma Schema（User、LearningProject、LearningProfile、Material、MaterialChunk、Outline、Lesson、Exercise、StudyRecord、ExerciseAttempt）
  - [x] SubTask 2.3: 配置 pgvector 扩展支持
  - [x] SubTask 2.4: 生成 Prisma Client

- [x] Task 3: 创建基础 UI 组件
  - [x] SubTask 3.1: 创建 Layout 组件（Header、Sidebar、Footer）
  - [x] SubTask 3.2: 创建通用组件（Button、Card、Input、Dialog）
  - [x] SubTask 3.3: 配置 Quantum Scholar 设计主题（颜色、字体、样式）

## Phase 2: 核心功能模块

- [x] Task 4: 实现学习目标问答模块
  - [x] SubTask 4.1: 创建学习建档页面 UI
  - [x] SubTask 4.2: 实现 AI 对话组件（消息列表、输入框）
  - [x] SubTask 4.3: 创建学习画像 API（/api/questionnaire/*）
  - [x] SubTask 4.4: 实现 AI Prompt 模板（结构化提问、画像生成）
  - [x] SubTask 4.5: 实现学习画像确认页面

- [x] Task 5: 实现资料上传与解析模块
  - [x] SubTask 5.1: 创建文件上传组件（拖拽上传）
  - [x] SubTask 5.2: 实现文件上传 API（/api/materials/upload）
  - [x] SubTask 5.3: 实现 TXT/MD 文件解析服务
  - [x] SubTask 5.4: 实现文本分块与向量化服务
  - [x] SubTask 5.5: 创建解析结果展示页面

- [x] Task 6: 实现学习大纲生成模块
  - [x] SubTask 6.1: 创建大纲生成 API（/api/materials/:id/generate-outline）
  - [x] SubTask 6.2: 实现 RAG 检索服务（向量相似度搜索）
  - [x] SubTask 6.3: 实现大纲生成 Prompt 模板
  - [x] SubTask 6.4: 创建大纲展示与编辑页面
  - [x] SubTask 6.5: 实现大纲手动编辑功能（增删改章节）

- [x] Task 7: 实现课程内容生成模块
  - [x] SubTask 7.1: 创建课程生成 API（/api/courses/generate）
  - [x] SubTask 7.2: 实现章节内容生成 Prompt 模板
  - [x] SubTask 7.3: 实现内容结构验证逻辑
  - [x] SubTask 7.4: 创建课程列表页面

- [x] Task 8: 实现章节学习模块
  - [x] SubTask 8.1: 创建学习中心页面（章节列表、进度显示）
  - [x] SubTask 8.2: 创建章节学习页面（内容展示）
  - [x] SubTask 8.3: 实现学习进度 API（/api/progress/*）
  - [x] SubTask 8.4: 实现断点续学功能
  - [x] SubTask 8.5: 实现学习时长记录

- [x] Task 9: 实现练习题模块
  - [x] SubTask 9.1: 创建练习题生成 API（/api/lessons/:id/exercises）
  - [x] SubTask 9.2: 实现练习题生成 Prompt 模板
  - [x] SubTask 9.3: 创建练习题组件（选择题）
  - [x] SubTask 9.4: 实现答案提交与反馈 API（/api/exercises/:id/submit）
  - [x] SubTask 9.5: 创建答题反馈展示组件

## Phase 3: 完善与优化

- [x] Task 10: 实现首页
  - [x] SubTask 10.1: 创建首页 Hero 区域
  - [x] SubTask 10.2: 创建 BENTO 功能展示区域
  - [x] SubTask 10.3: 实现创建学习项目入口

- [x] Task 11: 实现学习进度管理
  - [x] SubTask 11.1: 创建进度统计服务
  - [x] SubTask 11.2: 创建进度展示组件
  - [x] SubTask 11.3: 实现学习记录查询 API

- [ ] Task 12: 错误处理与兜底方案
  - [ ] SubTask 12.1: 实现全局错误处理
  - [ ] SubTask 12.2: 实现文件解析失败兜底（手动输入大纲）
  - [ ] SubTask 12.3: 实现 AI 生成失败重试机制

- [ ] Task 13: 测试与验证
  - [ ] SubTask 13.1: 编写核心 API 单元测试
  - [ ] SubTask 13.2: 执行质量评审表检查
  - [ ] SubTask 13.3: 修复发现的问题

---

# Task Dependencies

- Task 2 depends on Task 1
- Task 3 depends on Task 1
- Task 4 depends on Task 2, Task 3
- Task 5 depends on Task 2, Task 3
- Task 6 depends on Task 5
- Task 7 depends on Task 6
- Task 8 depends on Task 7
- Task 9 depends on Task 7
- Task 10 depends on Task 3
- Task 11 depends on Task 8
- Task 12 depends on Task 4, Task 5, Task 6, Task 7
- Task 13 depends on Task 1-12

---

# Parallelizable Work

以下任务可以并行执行：
- Task 3 与 Task 2（UI 组件与数据库配置）
- Task 4、Task 5（学习目标问答与资料上传模块）
- Task 8、Task 9（章节学习与练习题模块）
- Task 10、Task 11（首页与进度管理）

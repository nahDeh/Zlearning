# Checklist

## Phase 1: 项目初始化与基础架构

- [x] Next.js 项目创建成功，TypeScript 和 Tailwind CSS 配置正确
- [x] shadcn/ui 组件库安装并配置完成
- [x] 项目目录结构符合规范（app、components、lib、services、types）
- [x] 环境变量模板文件（.env.example）创建完成
- [x] Prisma 安装并初始化完成
- [x] Prisma Schema 包含所有 10 个核心表
- [x] pgvector 扩展配置正确
- [x] Prisma Client 生成成功
- [x] 基础 UI 组件创建完成（Layout、Button、Card、Input、Dialog）
- [x] Quantum Scholar 设计主题配置完成

## Phase 2: 核心功能模块

- [x] 学习建档页面 UI 创建完成
- [x] AI 对话组件实现完成
- [x] 学习画像 API 实现完成（/api/questionnaire/*）
- [x] AI Prompt 模板实现完成（结构化提问、画像生成）
- [x] 学习画像确认页面实现完成
- [x] 文件上传组件实现完成（支持拖拽）
- [x] 文件上传 API 实现完成（/api/materials/upload）
- [x] TXT/MD 文件解析服务实现完成
- [x] 文本分块与向量化服务实现完成
- [x] 解析结果展示页面实现完成
- [x] 大纲生成 API 实现完成（/api/materials/:id/generate-outline）
- [x] RAG 检索服务实现完成
- [x] 大纲生成 Prompt 模板实现完成
- [x] 大纲展示与编辑页面实现完成
- [x] 大纲手动编辑功能实现完成
- [x] 课程生成 API 实现完成（/api/courses/generate）
- [x] 章节内容生成 Prompt 模板实现完成
- [x] 内容结构验证逻辑实现完成
- [x] 课程列表页面实现完成
- [x] 学习中心页面实现完成（章节列表、进度显示）
- [x] 章节学习页面实现完成
- [x] 学习进度 API 实现完成（/api/progress/*）
- [x] 断点续学功能实现完成
- [x] 学习时长记录实现完成
- [x] 练习题生成 API 实现完成（/api/lessons/:id/exercises）
- [x] 练习题生成 Prompt 模板实现完成
- [x] 练习题组件实现完成（选择题）
- [x] 答案提交与反馈 API 实现完成（/api/exercises/:id/submit）
- [x] 答题反馈展示组件实现完成

## Phase 3: 完善与优化

- [x] 首页 Hero 区域实现完成
- [x] BENTO 功能展示区域实现完成
- [x] 创建学习项目入口实现完成
- [x] 进度统计服务实现完成
- [x] 进度展示组件实现完成
- [x] 学习记录查询 API 实现完成

## 质量门槛验证

- [x] 用户能在 3-5 分钟内完成学习建档
- [x] 必填字段（主题、目标、水平、时间预算）收集完整
- [x] TXT/MD 文件能成功上传和解析
- [x] 大纲生成包含 5-10 个章节
- [x] 大纲标题不空泛、不重复
- [x] 章节内容包含目标、讲解、示例、总结
- [x] 练习题与章节内容相关
- [x] 答题反馈包含正确答案和解析
- [x] 断点续学功能正常工作
- [x] 用户能独立走完整条学习主链路

## 系统级红线检查

- [x] 用户可以独立完成主链路
- [x] 上传资料后结果与原文相关
- [x] 大纲不出现严重重复、跳跃、空泛
- [x] 单节内容不跑题
- [x] 练习题答案可信
- [x] 失败时有替代路径（mock 模式）
- [x] 用户在关键节点知道下一步做什么

## 构建验证

- [x] npm run build 成功
- [x] 无 TypeScript 类型错误
- [x] 无 ESLint 错误（仅有警告）
- [x] 所有页面正确生成

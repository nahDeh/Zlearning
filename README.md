# 智学 AI 学习平台

一个基于 Next.js 14+ 的 AI 个性化学习平台，通过智能问答、资料解析、大纲生成、课程创建等功能，帮助用户完成持续、自适应的学习闭环。

## 功能特性

- 🎯 **智能学习建档** - AI 结构化提问，生成个性化学习画像
- 📄 **资料上传解析** - 支持 TXT/MD/PDF/EPUB，自动提取文本并分块
- 📚 **大纲自动生成** - 基于资料和学习画像生成结构化学习大纲
- 📖 **课程内容生成** - AI 生成详细章节内容，包含目标、讲解、示例、总结
- ✍️ **练习题生成** - 为每章节生成选择题，提供答案解析
- 📊 **学习进度追踪** - 记录学习时长、完成状态，支持断点续学
- 🎨 **现代化 UI** - Quantum Scholar 设计语言，BENTO 布局，玻璃拟态效果

## 技术栈

- **前端**: Next.js 14 + React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **后端**: Next.js API Routes + Prisma ORM
- **数据库**: SQLite（默认开发环境）/ PostgreSQL + pgvector（规划或可选）
- **AI**: 支持多种 AI API（OpenAI、硅基流动等）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库和 AI API：

```bash
# Database
# 默认使用 SQLite（无需额外安装数据库）
DATABASE_URL="file:./dev.db"

# AI API Configuration
AI_API_BASE_URL="https://api.openai.com/v1"
AI_API_KEY="sk-..."
AI_MODEL="gpt-4o-mini"
```

如需切换到 PostgreSQL（可选/规划），可将 `DATABASE_URL` 配置为：

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/zhixue"
```

### 3. 配置 AI API

项目支持多种 AI API，通过环境变量配置：

#### 使用 OpenAI

```bash
AI_API_BASE_URL="https://api.openai.com/v1"
AI_API_KEY="sk-..."
AI_MODEL="gpt-4o-mini"
```

#### 使用硅基流动

```bash
AI_API_BASE_URL="https://api.siliconflow.cn/v1"
AI_API_KEY="sk-..."
AI_MODEL="Qwen/Qwen2.5-7B-Instruct"
```

#### 使用其他兼容 OpenAI API 的服务

只要 API 兼容 OpenAI 的 `/v1/chat/completions` 接口，都可以通过配置 `AI_API_BASE_URL` 来使用。

### 4. 数据库迁移

```bash
npx prisma migrate dev
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
c:\code\ZLearning\
├── app/                      # Next.js App Router
│   ├── api/                  # API 路由
│   ├── onboarding/           # 学习建档页面
│   ├── materials/            # 资料详情页面
│   ├── outlines/             # 大纲编辑页面
│   ├── courses/              # 课程列表页面
│   ├── lessons/              # 章节学习页面
│   └── learn/                # 学习中心页面
├── components/               # React 组件
│   ├── ui/                   # shadcn/ui 基础组件
│   ├── chat/                 # AI 对话组件
│   ├── upload/               # 文件上传组件
│   ├── outline/              # 大纲编辑组件
│   ├── lesson/               # 章节内容组件
│   └── exercise/             # 练习题组件
├── services/                 # 业务服务
│   ├── ai.ts                 # AI 服务（支持自定义 API）
│   ├── parser.ts             # 文件解析服务
│   └── chunker.ts            # 文本分块服务
├── lib/                      # 工具库
│   ├── prisma.ts             # Prisma 客户端
│   ├── constants.ts          # 常量配置
│   └── utils.ts              # 工具函数
├── types/                    # TypeScript 类型
└── prisma/                   # 数据库 Schema
```

## API 文档

完整的 API 文档请查看 [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 开发命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `DATABASE_URL` | 是 | Prisma 数据库连接字符串（默认 SQLite；也可配置 PostgreSQL） |
| `AI_API_BASE_URL` | 否 | AI API 基础 URL，默认 `https://api.openai.com/v1` |
| `AI_API_KEY` | 否 | AI API 密钥（不配置则使用 Mock 模式） |
| `AI_MODEL` | 否 | AI 模型名称，默认 `gpt-4o-mini` |
| `UPLOAD_DIR` | 否 | 文件上传目录，默认 `./uploads` |
| `MAX_FILE_SIZE` | 否 | 最大文件大小，默认 `52428800`（50MB） |
| `NEXT_PUBLIC_APP_URL` | 否 | 应用 URL，默认 `http://localhost:3000` |

## 设计规范

项目采用 **Quantum Scholar** 设计语言：

- **布局风格**: BENTO Grid（非对称网格）
- **视觉效果**: 玻璃拟态（Glassmorphism）
- **主色调**: Indigo (#4F46E5) + Cyan (#06B6D4) 渐变
- **字体**: Outfit（标题）+ Inter（正文）

## Mock 模式

当未配置 `AI_API_KEY` 环境变量时，API 会自动进入 Mock 模式，返回模拟数据。这适用于开发和测试环境。

## License

MIT

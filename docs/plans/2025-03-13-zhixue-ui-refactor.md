# 智学AI学习平台UI重构实施计划

> **目标:** 根据UI设计图重构所有页面，统一设计风格，对接后端API接口

**架构:** 基于Next.js + Tailwind CSS + shadcn/ui，采用玻璃态设计风格，主色调为Cyan-Indigo渐变。所有页面保持一致的视觉语言和交互体验。

**技术栈:** Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons

---

## 设计规范

### 色彩系统
- **主色:** Cyan (#06B6D4) - 用于主要按钮、高亮、进度条
- **辅助色:** Indigo (#4F46E5) - 用于渐变、链接
- **背景:** 浅色渐变 `from-slate-50 via-cyan-50/30 to-blue-50/20`
- **卡片背景:** 白色/玻璃态 `bg-white/80 backdrop-blur-xl`
- **文字:** Slate-900 (主标题), Slate-600 (正文), Slate-400 (辅助)

### 圆角与阴影
- **大卡片:** `rounded-3xl`
- **按钮:** `rounded-full` (主要) / `rounded-xl` (次要)
- **阴影:** `shadow-lg shadow-slate-200/20`

### 字体
- **标题:** Outfit, sans-serif
- **正文:** Inter, sans-serif

---

## Task 1: 重构全局样式和布局

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `tailwind.config.ts`

**Step 1: 更新全局CSS变量**

```css
/* 在 :root 中添加 */
--cyan-50: 187 94% 97%;
--cyan-100: 187 94% 92%;
--cyan-400: 187 94% 43%;
--cyan-500: 187 94% 38%;
--cyan-600: 187 94% 33%;
```

**Step 2: 更新layout.tsx背景**

```tsx
<body className="antialiased min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
```

**Step 3: 提交**

```bash
git add app/globals.css app/layout.tsx
git commit -m "style: update global styles with cyan theme"
```

---

## Task 2: 重构首页 (page.tsx)

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/home/HeroSection.tsx`
- Modify: `components/home/FeaturesGrid.tsx`
- Modify: `components/home/Navbar.tsx`

**Step 1: 更新HeroSection组件**

添加副标题和更好的视觉层次：

```tsx
<section className="pt-32 pb-12 px-4">
  <div className="max-w-4xl mx-auto text-center">
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 tracking-tight">
      AI 个性化学习
    </h1>
    <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
      通过 AI 个性化学习教练，帮助你完成持续、自适应的学习闭环
    </p>
    {/* 按钮保持不变 */}
  </div>
</section>
```

**Step 2: 更新FeaturesGrid卡片样式**

统一使用玻璃态卡片：

```tsx
<div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg shadow-slate-200/20 p-6 hover:shadow-xl hover:shadow-cyan-100/30 transition-all duration-300 hover:-translate-y-1">
```

**Step 3: 更新Navbar样式**

确保Navbar使用正确的玻璃态效果：

```tsx
<nav className="max-w-6xl mx-auto bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg shadow-slate-200/20 px-6 py-3">
```

**Step 4: 提交**

```bash
git add app/page.tsx components/home/
git commit -m "refactor: redesign homepage with glassmorphism cards"
```

---

## Task 3: 重构引导页 (onboarding/page.tsx)

**Files:**
- Modify: `app/onboarding/page.tsx`
- Modify: `components/chat/ChatInterface.tsx`

**Step 1: 更新页面布局**

使用玻璃态设计：

```tsx
<div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
  <header className="border-b bg-white/80 backdrop-blur-xl">
    {/* ... */}
  </header>
  <main className="flex-1 container max-w-3xl mx-auto px-4 py-6">
    <Card className="h-[calc(100vh-220px)] flex flex-col bg-white/80 backdrop-blur-xl border-white/40 shadow-xl">
      {/* ... */}
    </Card>
  </main>
</div>
```

**Step 2: 更新进度条样式**

```tsx
<Progress value={progress} className="h-2 bg-slate-200 [&>div]:bg-gradient-to-r [&>div]:from-cyan-400 [&>div]:to-cyan-500" />
```

**Step 3: 提交**

```bash
git add app/onboarding/page.tsx components/chat/ChatInterface.tsx
git commit -m "refactor: redesign onboarding page with glassmorphism"
```

---

## Task 4: 重构引导确认页 (onboarding/confirm/page.tsx)

**Files:**
- Modify: `app/onboarding/confirm/page.tsx`

**Step 1: 更新页面背景**

```tsx
<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
  <Card className="w-full max-w-2xl bg-white/80 backdrop-blur-xl border-white/40 shadow-xl">
    {/* ... */}
  </Card>
</div>
```

**Step 2: 更新信息卡片样式**

```tsx
<div className="flex items-start gap-3 p-4 rounded-xl bg-cyan-50/50 border border-cyan-100">
```

**Step 3: 提交**

```bash
git add app/onboarding/confirm/page.tsx
git commit -m "refactor: redesign onboarding confirm page"
```

---

## Task 5: 重构学习中心 (learn/page.tsx)

**Files:**
- Modify: `app/learn/page.tsx`

**Step 1: 更新顶部状态栏**

```tsx
<div className="bg-slate-900 text-white px-4 py-3">
  <div className="max-w-6xl mx-auto flex items-center justify-between">
    {/* 连续学习、知识等级、通知 */}
  </div>
</div>
```

**Step 2: 更新卡片样式**

所有卡片使用统一风格：

```tsx
<Card className="bg-white/80 backdrop-blur-xl border-white/40 shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
```

**Step 3: 更新环形进度条**

使用Cyan渐变：

```tsx
<circle
  cx="50"
  cy="50"
  r="42"
  fill="none"
  stroke="url(#cyanGradient)"
  strokeWidth="8"
  strokeLinecap="round"
/>
```

**Step 4: 提交**

```bash
git add app/learn/page.tsx
git commit -m "refactor: redesign learn page with unified card styles"
```

---

## Task 6: 重构课程详情页 (courses/[id]/page.tsx)

**Files:**
- Modify: `app/courses/[id]/page.tsx`

**Step 1: 更新页面背景**

```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20 py-8">
  <div className="container mx-auto px-4">
    {/* ... */}
  </div>
</div>
```

**Step 2: 更新章节卡片**

```tsx
<Card className="bg-white/80 backdrop-blur-xl border-white/40 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 rounded-2xl">
  <CardHeader className="pb-2">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center text-white font-bold">
          {chapter.orderIndex}
        </div>
        <CardTitle className="text-lg">{chapter.title}</CardTitle>
      </div>
      {/* 难度标签 */}
    </div>
  </CardHeader>
</Card>
```

**Step 3: 提交**

```bash
git add app/courses/\[id\]/page.tsx
git commit -m "refactor: redesign course detail page"
```

---

## Task 7: 重构大纲编辑页 (outlines/[id]/page.tsx)

**Files:**
- Modify: `app/outlines/[id]/page.tsx`
- Modify: `components/outline/OutlineEditor.tsx`

**Step 1: 更新页面布局**

```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20">
  <div className="container max-w-4xl py-8">
    {/* ... */}
  </div>
</div>
```

**Step 2: 更新卡片样式**

```tsx
<Card className="bg-white/80 backdrop-blur-xl border-white/40 shadow-lg rounded-2xl">
```

**Step 3: 提交**

```bash
git add app/outlines/\[id\]/page.tsx components/outline/OutlineEditor.tsx
git commit -m "refactor: redesign outline editor page"
```

---

## Task 8: 重构课时页 (lessons/[id]/page.tsx)

**Files:**
- Modify: `app/lessons/[id]/page.tsx`

**Step 1: 保持深色主题**

课时页使用深色主题（根据UI图）：

```tsx
<div className="min-h-screen bg-slate-900 text-slate-200">
  {/* 顶部导航 */}
  <header className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 px-4 py-3">
    {/* ... */}
  </header>
</div>
```

**Step 2: 更新代码块样式**

```tsx
<div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
  <div className="flex items-center gap-2 px-4 py-3 bg-slate-700/50 border-b border-slate-700">
    <div className="flex gap-1.5">
      <div className="w-3 h-3 rounded-full bg-red-500" />
      <div className="w-3 h-3 rounded-full bg-yellow-500" />
      <div className="w-3 h-3 rounded-full bg-green-500" />
    </div>
    <span className="text-xs text-slate-400 ml-2">python</span>
  </div>
  <pre className="p-4 text-sm font-mono text-slate-300 overflow-x-auto">
    <code>{code}</code>
  </pre>
</div>
```

**Step 3: 更新侧边栏样式**

```tsx
<aside className="w-64 bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 min-h-[calc(100vh-60px)] p-4">
```

**Step 4: 提交**

```bash
git add app/lessons/\[id\]/page.tsx
git commit -m "refactor: redesign lesson page with improved code blocks"
```

---

## Task 9: 重构学习资料页 (materials/[id]/page.tsx)

**Files:**
- Modify: `app/materials/[id]/page.tsx`

**Step 1: 更新页面布局**

```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/20 py-6">
  <div className="container mx-auto px-4 space-y-6">
    {/* ... */}
  </div>
</div>
```

**Step 2: 更新统计卡片**

```tsx
<Card className="bg-white/80 backdrop-blur-xl border-white/40 shadow-lg hover:shadow-xl transition-shadow rounded-2xl">
  <CardHeader className="pb-2">
    <CardDescription className="flex items-center gap-2 text-cyan-600">
      <FileText className="h-4 w-4" />
      文件类型
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold text-slate-800">{material.fileType.toUpperCase()}</p>
  </CardContent>
</Card>
```

**Step 3: 提交**

```bash
git add app/materials/\[id\]/page.tsx
git commit -m "refactor: redesign material detail page"
```

---

## Task 10: API接口对接验证

**Files:**
- 所有页面文件

**Step 1: 验证首页无需API调用**

首页是静态展示页面，无需API。

**Step 2: 验证引导页API**

- `POST /api/questionnaire/start` - 开始问卷
- `POST /api/questionnaire/answer` - 提交答案
- `POST /api/questionnaire/generate-profile` - 生成画像

**Step 3: 验证学习中心API**

- `GET /api/projects` - 获取项目列表
- `GET /api/progress?projectId={id}` - 获取进度

**Step 4: 验证课程详情API**

- `GET /api/outlines/{id}` - 获取大纲
- `POST /api/courses/generate` - 生成课程

**Step 5: 验证课时页API**

- `GET /api/lessons/{id}` - 获取课时内容
- `GET /api/lessons/{id}/exercises` - 获取练习题

**Step 6: 验证资料页API**

- 使用Prisma直接查询，无需额外API

**Step 7: 提交**

```bash
git commit -m "chore: verify all API integrations"
```

---

## Task 11: 最终验证和测试

**Step 1: 运行类型检查**

```bash
npm run type-check
```

**Step 2: 运行构建**

```bash
npm run build
```

**Step 3: 启动开发服务器验证**

```bash
npm run dev
```

访问以下页面验证：
- http://localhost:3000/ - 首页
- http://localhost:3000/onboarding - 引导页
- http://localhost:3000/learn - 学习中心

**Step 4: 最终提交**

```bash
git add .
git commit -m "feat: complete UI refactor for all pages with unified design system"
```

---

## [测试建议]

1. **视觉一致性检查**: 访问每个页面，确认卡片圆角、阴影、颜色是否统一
2. **响应式测试**: 在移动端和桌面端分别测试所有页面
3. **API功能测试**: 
   - 创建新项目流程（onboarding → confirm）
   - 查看学习进度（learn页面）
   - 查看课程大纲和课时内容
4. **深色模式测试**: 课时页确保深色主题显示正常

---

## 回滚方案

如需回滚，执行：

```bash
git log --oneline -20  # 查看提交历史
git reset --hard <commit-before-refactor>  # 回滚到重构前
```

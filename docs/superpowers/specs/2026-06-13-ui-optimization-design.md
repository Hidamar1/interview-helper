# UI 优化设计文档

> 日期：2026-06-13 | 状态：已与开发者确认

分三个阶段实施：C（移动端适配）→ A（补缺失）→ B（做精致），一次性实现。

---

## C 移动端适配

### 1. 首页 Hero 区 (`src/app/(main)/page.tsx`)

| 当前 | 优化后 |
|---|---|
| `<h1 className="text-4xl">` | 移动端 `text-2xl`，桌面 `text-4xl` |
| `py-14` | 移动端 `py-8`，桌面 `py-14` |
| `<div className="hidden sm:block">` 鸭子 130px | 移动端鸭子缩小到 80px 居中 |
| Hero 内部 `flex-row` | 移动端 `flex-col` |

### 2. 题库卡片网格 (`src/app/(main)/banks/page.tsx`)

| 当前 | 优化后 |
|---|---|
| `grid-cols-1 sm:2 lg:4` | 保持，但 4 列改为 `lg:grid-cols-3`（避免过挤） |
| 卡片 `p-5` | 移动端 `p-3`，桌面 `p-5` |

### 3. 题库详情页 (`src/app/(main)/banks/[slug]/page.tsx`)

- 题库图标描述区：移动端 `flex-col`，桌面 `flex-row`
- 筛选按钮行：横向滚动，无换行

### 4. 题目详情页 (`src/app/(main)/questions/[slug]/page.tsx`)

- 标题 + 收藏按钮：移动端 `flex-col` 收藏按钮在标题下方
- tags 行：允许折行 `flex-wrap`
- Markdown 内容：已有 prose，确认无溢出

### 5. 个人中心 (`src/app/(main)/profile/page.tsx`)

- 热力图：移动端 `overflow-x-auto`，格子缩小到 `10px × 10px`
- 用户信息区：移动端 `flex-col` 头像居中

### 6. 全局 Header (`src/components/layout/site-header.tsx`)

- 当前：`<nav>` 显示 3 个链接（题库/面试/刷题记录）
- 移动端（<640px）：导航链接收起到 Sheet 侧滑菜单
- 桌面端（>=640px）：与当前一致

### 7. 面试对话页 (`src/app/(main)/interview/[id]/page.tsx`)

- 顶部信息栏：移动端 padding 减半
- 输入框：移动端 `text-sm` 减少溢出

---

## A 补缺失

### A1 骨架屏

适用页面：首页、题库列表、题库详情、题目详情、个人中心、面试历史。

每个骨架屏使用 `bg-cream animate-pulse rounded-[14px]` 风格：
- 卡片骨架：矩形占位 + 3 行文字骨架
- 列表骨架：5 行交替宽度的骨架行

实现方式：每个页面级 Server Component 导出 `loading.tsx`（Next.js 内置）。

### A2 空状态组件

创建 `src/components/duck/duck-empty.tsx`：

```tsx
// 4 种空状态类型
<DuckEmpty type="search" />     // 搜索无结果
<DuckEmpty type="favorite" />   // 收藏为空
<DuckEmpty type="history" />    // 面试历史为空
<DuckEmpty type="general" />    // 通用空状态
```

每个空状态包含：鸭子 SVG（不同表情）+ 文案 + 引导链接（可选）。

### A3 404 / 500 页面

- `src/app/not-found.tsx` — 404：大号鸭子 + "找不到页面" + 回首页
- `src/app/error.tsx` — 500：大号鸭子 + "出了点问题" + 重试按钮

两者共用暖橙风格，不与 Next.js 默认灰色冲突。

### A4 Toast 组件

轻量级 toast（不引入第三方库）：

```tsx
// src/components/ui/toast.tsx
// src/components/ui/toaster.tsx — 在 root layout 渲染
// 使用：import { toast } from "@/lib/toast"
// toast("收藏成功")
```

固定在底部居中，2s 自动消失，暖橙背景。

---

## B 做精致

### B1 卡片 Hover 统一

所有卡片统一 hover 动效：
```css
hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-100 hover:border-primary
transition-all duration-200
```

### B2 按钮交互动效

- Primary 按钮：`hover:scale-[1.02] active:scale-[0.98] transition-transform`
- 收藏按钮心形：CSS `@keyframes heart-bounce` 点击弹跳

### B3 路由进度条

实现方式：监听 `app-router` 事件，顶部显示 3px 橙色加载条。
或者用简化的 CSS `top-0 h-[3px] bg-primary animate-pulse` 在路由变化时显示。

### B4 面试聊天打字光标

在 AI 消息最后一个字符后添加 `animate-pulse` 竖线光标，消息流式完成时隐藏。

---

## 文件清单

| 文件 | 类型 | 说明 |
|---|---|---|
| `src/app/(main)/page.tsx` | 修改 | 响应式 Hero |
| `src/app/(main)/banks/page.tsx` | 修改 | 卡片网格 + 骨架屏 |
| `src/app/(main)/banks/[slug]/page.tsx` | 修改 | 响应式 + 骨架屏 |
| `src/app/(main)/questions/[slug]/page.tsx` | 修改 | 响应式 + 骨架屏 |
| `src/app/(main)/profile/page.tsx` | 修改 | 响应式热力图 |
| `src/app/(main)/interview/[id]/page.tsx` | 修改 | 响应式 + 光标 |
| `src/components/layout/site-header.tsx` | 修改 | 移动端 Sheet 导航 |
| `src/components/duck/duck-empty.tsx` | 创建 | 空状态鸭子组件 |
| `src/components/ui/toast.tsx` | 创建 | Toast 组件 |
| `src/components/ui/toaster.tsx` | 创建 | Toast 容器 |
| `src/lib/toast.ts` | 创建 | Toast API |
| `src/app/not-found.tsx` | 创建 | 404 页面 |
| `src/app/error.tsx` | 创建 | 500 页面 |
| `src/app/(main)/banks/loading.tsx` | 创建 | 题库列表骨架屏 |
| `src/app/(main)/banks/[slug]/loading.tsx` | 创建 | 题库详情骨架屏 |
| `src/app/(main)/questions/[slug]/loading.tsx` | 创建 | 题目详情骨架屏 |
| `src/app/(main)/profile/loading.tsx` | 创建 | 个人中心骨架屏 |
| `src/app/(main)/interview/history/loading.tsx` | 创建 | 历史列表骨架屏 |

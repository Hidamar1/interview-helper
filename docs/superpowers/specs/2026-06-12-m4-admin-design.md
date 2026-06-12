# M4 管理后台 — 设计文档

> 日期：2026-06-12 | 状态：已与开发者确认

## 1. 概述

为面试突击鸭添加管理后台，允许 ADMIN 角色用户通过 Web 界面管理题库（QuestionBank）和题目（Question）的增删改查。

## 2. 权限架构

```
用户请求 /admin/*
  → Middleware（cookie 检查，复用 M2 已有中间件）
  → 页面 / Server Action 内 auth.api.getSession + role === "ADMIN"
  → 非 ADMIN → 拒绝访问
```

- **中间件**：M2 已有 `src/middleware.ts`，matcher 从 `["/profile", "/interview/:path*"]` 扩展为 `["/profile", "/interview/:path*", "/admin/:path*"]`
- **页面层**：每个 admin 页面的 Server Component 二次校验 `session.user.role === "ADMIN"`
- **Server Action 层**：每个 Action 二次校验 `role === "ADMIN"`
- **UI 入口**：`UserMenu` 组件中，ADMIN 用户可见"管理后台"链接。非 ADMIN 用户不可见

### 管理员产生

- `.env` 中配置 `ADMIN_EMAIL` 白名单（逗号分隔）
- `seed.ts` 运行时按白名单 upsert user，将 role 设为 ADMIN
- 也可手动在 Neon 控制台执行 SQL 升级

## 3. 后台布局

### 3.1 侧边栏（Sidebar）

- 左侧固定 220px 宽度，暖橙主色调
- 导航项：题库管理、题目管理（链接到 `/admin/banks`、`/admin/questions`）
- 底部：返回前台链接
- 移动端（< 768px）：使用 `sheet` 组件收起侧栏，顶部显示汉堡菜单

### 3.2 内容区

- 占满右侧剩余宽度，padding 24px
- 背景色 `bg-cream`（#FFF7ED），与前台一致

### 3.3 独立布局

- `src/app/admin/layout.tsx` 实现，不继承 `(main)` 布局组
- 不使用 SiteHeader / SiteFooter

## 4. 路由与文件

```
src/app/admin/
├── layout.tsx                        # 侧边栏布局
├── page.tsx                          # 重定向到 /admin/banks
├── banks/page.tsx                    # 题库列表（table + dialog 弹窗 新建/编辑）
├── questions/page.tsx                # 题目列表（table + dialog 弹窗 新建/编辑）

src/components/admin/
├── admin-sidebar.tsx                 # 侧边栏导航组件
├── bank-form.tsx                     # 题库表单（dialog 内部）
├── question-form.tsx                 # 题目表单（dialog 内部，含追问链动态卡片）
├── follow-up-card.tsx                # 单条追问项（题目 + 提示 textarea）

src/lib/actions/admin/
├── bank.ts                           # Bank CRUD（createBank/updateBank/deleteBank）
├── question.ts                       # Question CRUD（createQuestion/updateQuestion/deleteQuestion）
```

### 4.1 shadcn 组件需求

M1 已有 `button`、`badge`、`input`。M4 新增：
- `textarea` — 答案详解（Markdown）编辑
- `select` — 分类/难度下拉
- `table` — 列表展示
- `dialog` — 新建/编辑弹窗
- `label` — 表单标签
- `sheet` — 移动端侧边栏

## 5. 数据流

### 5.1 Server Actions（"use server"）

所有操作通过 Server Actions 完成，每个 Action：
1. 调用 `auth.api.getSession()` 获取当前用户
2. 校验 `role === "ADMIN"`
3. 操作 Prisma
4. `revalidatePath()` 刷新页面

### 5.2 页面渲染

- 所有 admin 页面 `force-dynamic`
- Server Component 查询数据后传给客户端 table 组件

### 5.3 删除确认

- 点击删除按钮 → Dialog 二次确认 → 确认后执行 delete Action
- 题库有题目关联时，提示不可删除（或先清空题目）

## 6. 题库 CRUD 表单字段

| 字段 | 类型 | 组件 | 说明 |
|------|------|------|------|
| name | String | input | 题库名称 |
| slug | String | input | URL 标识（小写英文连字符） |
| description | String | textarea | 题库描述 |
| icon | String | input | Emoji 图标 |
| category | String | select | 8 个分类之一 |
| sortOrder | Int | input(number) | 排序序号 |

## 7. 题目 CRUD 表单字段

| 字段 | 类型 | 组件 | 说明 |
|------|------|------|------|
| title | String | input | 题目标题 |
| slug | String | input | URL 标识 |
| answerBrief | String | input | 30 秒速记版 |
| answerDetail | String | textarea | 详解版（Markdown） |
| followUps | Json | 动态卡片列表 | 2-4 条追问，每条含 question + hint |
| difficulty | Enum | select | EASY / MEDIUM / HARD |
| tags | String[] | input（逗号分隔）| 1-6 个标签 |
| bankId | String | select | 所属题库 |

## 8. 验证

- **前端**：zod schema 校验表单字段（复用 M1 `question-schema.ts` 中的 seed schema）
- **后端**：Server Action 入参 zod 校验 + role 检查
- **slug 唯一性**：create 时先查是否已存在，update 时按 id 排除自身

## 9. E2E 黄金路径

```
ADMIN 登录 → 进入 /admin（侧边栏可见）
  → "题库管理" → 编辑题库信息 → 保存
  → "题目管理" → 新建题目 → 填写表单 → 保存 → 列表刷新
  → 编辑题目 → 修改追问链 → 保存
  → 删除题目 → 二次确认 → 题目消失
  → "返回前台" → 回到前台首页
非 ADMIN 用户 → 侧边栏不显示"管理后台"链接 → 直接访问 /admin 被拒
```

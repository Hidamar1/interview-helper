# CLAUDE.md — 面试突击鸭（interview-helper）

> 面向编程求职者的面试刷题平台：题库刷题 + AI 模拟面试。
> 个人学习/作品集项目，不做支付/会员/商业化。

## 技术栈速览

| 层 | 选型 | 版本 |
|---|---|---|
| 框架 | Next.js 16 (App Router) | 16.2.x |
| UI | React 19 + Tailwind CSS 4 + shadcn/ui 4 | 19.2 / 4.x |
| ORM | Prisma 7 | 7.x |
| 数据库 | 开发：本地 PostgreSQL 17 / 生产：Neon PostgreSQL |
| ORM 适配器 | dev: `@prisma/adapter-pg` / prod: `@prisma/adapter-neon` |
| 认证 | Better Auth（邮箱密码 + GitHub OAuth） | 最新 |
| AI | Vercel AI SDK v6 + @ai-sdk/deepseek | 6.x |
| 校验 | zod 4 | 4.x |
| 测试 | Vitest + Testing Library + Playwright | 最新 |
| 包管理 | pnpm 10 | 10.x |

## 项目结构

```
src/
├── app/                    # App Router 页面
│   ├── (main)/             # 前台布局：首页/题库/题目/搜索/面试/个人中心
│   ├── (auth)/             # 登录注册
│   ├── admin/              # 管理后台（侧边栏布局）
│   ├── api/
│   │   ├── auth/[...all]/  # Better Auth handler
│   │   └── interview/[id]/chat/  # AI 流式对话
│   ├── not-found.tsx       # 自定义 404
│   └── error.tsx           # 自定义 500
├── components/
│   ├── ui/                 # shadcn 暖橙改造组件（含 toast）
│   ├── duck/               # 吉祥物鸭子 SVG 组件 + 空状态
│   ├── auth/               # 登录/注册表单 + 用户菜单
│   ├── admin/              # 后台管理（题库/题目 CRUD 表格）
│   ├── interview/          # 面试准备/聊天/报告/雷达图
│   ├── question/           # 三层答案/题目行
│   └── layout/             # 导航 + 移动端 Sheet
├── lib/
│   ├── db.ts               # Prisma 客户端（条件适配 Neon/本地 PG）
│   ├── auth.ts             # Better Auth 配置
│   ├── auth-client.ts      # Better Auth 前端客户端
│   ├── admin-check.ts      # ADMIN 角色校验工具
│   ├── ai.ts               # LLM provider 切换（DeepSeek/mock）
│   ├── actions/            # Server Actions（favorite/study/interview/admin）
│   └── prompts/            # AI 面试官提示词 + 报告 zod schema
prisma/
├── schema.prisma
└── seed.ts                 # 种子数据（303 道题 + ADMIN 邮箱升级）
data/questions/             # 种子 JSON 数据（8 个分类）
e2e/                        # Playwright E2E
```

## 里程碑进度

| 里程碑 | 状态 | 内容 |
|---|---|---|
| M0 脚手架 | ✅ 已完成 | 项目初始化、暖橙主题、数据库连通、CI 基建 |
| M1 题库核心 | ✅ 已完成 | 303 道种子题、首页/题库/题目三层答案/搜索、E2E |
| M2 用户体系 | ✅ 已完成 | Better Auth、收藏、刷题记录、个人中心热力图 |
| M3 AI 模拟面试 | ✅ 已完成 | DeepSeek 流式对话、评分报告、SVG 雷达图、薄弱点回链 |
| M4 管理后台 | ✅ 已完成 | 侧边栏布局、题库/题目 CRUD（Dialog 弹窗 + 追问链编辑） |
| UI 优化 | ✅ 已完成 | 移动端适配、骨架屏、404/500、空状态鸭子、Toast、动效 |
| 本地 PostgreSQL | ✅ 已完成 | 替换 Neon 用于开发（~50ms 替代 ~3s 延迟） |
| 部署上线 | ✅ 已完成 | Vercel + Neon 生产环境 |

## 关键技术决策

### AI SDK v6
- `useChat` + `DefaultChatTransport` 实现流式对话
- `streamText` → `result.toUIMessageStreamResponse()` 
- `generateObject` 生成结构化评分报告
- `convertToModelMessages` 转换前端消息格式

### Prisma 7 适配器
- `lib/db.ts` 根据 `DATABASE_URL` 是否包含 `neon.tech` 自动切换适配器
- 本地：`@prisma/adapter-pg`（`pg` Pool）
- 生产：`@prisma/adapter-neon`（WebSocket）
- 文件顶部 `/* eslint-disable @typescript-eslint/no-require-imports */`

### 中间件 Cookie
- Edge Runtime 不能直接查库，只做 cookie 存在性检查
- 生产环境（HTTPS）浏览器给 Secure cookie 加 `__Secure-` 前缀
- 同时检查 `__Secure-better-auth.session_token` 和 `better-auth.session_token`

### 三层答案
- 用原生 `<details>/<summary>`（修复水合竞态，勿改回 onClick）
- `searchParams` 用 `firstParam` 防数组 500

### 面试流程
- 准备页创建 Session(AcTIVE) → `useChat` POST API Route
- API Route 从题库抽题注入系统提示词 → DeepSeek 流式回答
- `[END_INTERVIEW]` 标记 → 会话 FINISHED
- Report 页触发 `generateObject` → 结构化报告缓存到数据库

### 管理后台
- ADMIN 角色通过 `ADMIN_EMAIL` 白名单 seed 自动升级
- 页面 + Server Action 双层校验 `requireAdmin()`
- 侧边栏布局（固定桌面 + Sheet 移动端）

### 样式 token
- 主橙 `#FF7D00`、鸭黄 `#FFB01F`、奶油底 `#FFF7ED`、卡片圆角 14px
- shadcn 全部暖橙改造，禁止默认灰黑/紫蓝样式直出
- API 密钥只在 `.env`（不入库），`.env` 内容绝不输出到对话

## 工作流约定

每个里程碑严格遵循：
1. `writing-plans` 出计划 → 用户确认
2. 建 `feature/mX-xxx` 分支
3. `subagent-driven-development` 或内联执行
4. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` + E2E 全绿
5. 最终审查 → 用户人工验收 → 合并 master → 删分支

提交：Conventional Commits 中文描述。

## 红线

- ❌ 不做需求 §5 YAGNI 清单功能（支付/会员/小程序/ES/暗色模式等）
- ❌ UI 禁用紫蓝渐变和 shadcn 默认样式直出
- ❌ 不强推 master/main
- ❌ 不输出 `.env` 内容

## 环境注意事项

- **Windows + git-bash** 开发环境
- 停端口：`netstat -ano | findstr :3000` 找 PID → `taskkill //F //PID xxx`
- corepack 已禁用
- `pnpm build` 后直接 `pnpm dev` 可能产物冲突，必要时删 `.next`
- 本地 PostgreSQL 需先启动服务（`pg_isready` 检查）
- 切换到 Neon 只需改 `.env` 的连接串，代码自动适配
- 所有 MCP/skill 调用以 `Skill` 工具为准，不要用 Read 读 SKILL.md

## 参考文档

- 需求基线：`docs/01-需求分析.md`
- 技术方案：`docs/02-技术方案.md`
- 实现计划：`docs/superpowers/plans/`
- 设计文档：`docs/superpowers/specs/`
- 视觉原型：`docs/superpowers/mockups/visual-style.html`
- andrej-karpathy-skills 规范：`.claude/rules/karpathy-skills.md`
- 部署地址：`https://interview-helper-roan.vercel.app`

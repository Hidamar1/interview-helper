# CLAUDE.md — 面试突击鸭（interview-helper）

> 面向编程求职者的面试刷题平台：题库刷题 + AI 模拟面试。
> 个人学习/作品集项目，不做支付/会员/商业化。

## 技术栈速览

| 层 | 选型 | 版本 |
|---|---|---|
| 框架 | Next.js 16 (App Router) | 16.2.x |
| UI | React 19 + Tailwind CSS 4 + shadcn/ui 4 | 19.2 / 4.x |
| ORM | Prisma 7 + @prisma/adapter-neon | 7.x |
| 数据库 | Neon PostgreSQL (serverless) | - |
| 认证 | Better Auth（M2 接入） | 最新 |
| AI | Vercel AI SDK v6 + @ai-sdk/deepseek | 6.x |
| 校验 | zod 4 | 4.x |
| 测试 | Vitest + Testing Library + Playwright | 最新 |
| 包管理 | pnpm 10 | 10.x |

## 项目结构

```
src/
├── app/                    # App Router 页面
│   ├── (main)/             # 前台布局：首页/题库/题目/搜索
│   ├── (auth)/             # 登录注册（M2）
│   ├── admin/              # 管理后台（M4）
│   └── api/                # Route Handlers（Auth/AI）
├── components/
│   ├── ui/                 # shadcn 暖橙改造组件
│   └── duck/               # 吉祥物鸭子 SVG 组件
├── lib/
│   ├── db.ts               # Prisma 客户端单例（adapter-neon）
│   ├── actions/            # Server Actions
│   └── ai.ts               # LLM provider 切换
prisma/
├── schema.prisma
└── seed.ts                 # 种子数据（303 道题）
data/questions/             # 种子 JSON 数据（8 个分类）
e2e/                        # Playwright E2E
docs/                       # 需求/技术方案基线
```

## 里程碑进度

| 里程碑 | 状态 | 内容 |
|---|---|---|
| M0 脚手架 | ✅ 已验收 | 项目初始化、暖橙主题、数据库连通、CI 基建 |
| M1 题库核心 | ✅ 已验收 | 303 道种子题、首页/题库/题目三层答案/搜索、E2E |
| **M2 用户体系** | **← 下一步** | Better Auth、收藏、刷题记录、个人中心热力图 |
| M3 AI 模拟面试 | 待开始 | DeepSeek 流式对话、评分报告、雷达图 |
| M4 管理后台 | 待开始 | 题库/题目 CRUD |

## 关键技术决策

- **AI SDK 锁定 v6**（ai@6 + @ai-sdk/react@6），v4/v5/v6 useChat API 互不兼容
- **Prisma 7** 连接：CLI 走 `prisma.config.ts` 的 DIRECT_URL，运行时 `lib/db.ts` 用 adapter-neon + DATABASE_URL
- **Node 20** 需 `ws` 注入（Neon serverless 依赖）
- **三层答案**用原生 `<details>/<summary>`（修复过水合竞态，勿改回 onClick 方案）
- **searchParams** 用 `firstParam` 归一化防数组 500
- **查库页面**一律 `force-dynamic`
- **shadcn** 全部暖橙改造，禁止默认灰黑/紫蓝样式直出
- **样式 token**：主橙 `#FF7D00`、鸭黄 `#FFB01F`、奶油底 `#FFF7ED`、卡片圆角 14px
- API 密钥只在 `.env`（不入库），`.env` 内容绝不输出到对话

## 工作流约定

每个里程碑严格遵循：
1. `writing-plans` 出计划 → 用户确认
2. 建 `feature/mX-xxx` 分支
3. `subagent-driven-development` 逐任务实现（TDD + 两阶段审查）
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
- Neon 冷启动首次请求慢（数百 ms）属正常
- 所有 MCP/skill 调用以 `Skill` 工具为准，不要用 Read 读 SKILL.md

## 参考文档

- 需求基线：`docs/01-需求分析.md`
- 技术方案：`docs/02-技术方案.md`
- 实现计划：`docs/superpowers/plans/`
- 视觉原型：`docs/superpowers/mockups/visual-style.html`
- andrej-karpathy-skills 规范：`.claude/rules/karpathy-skills.md`

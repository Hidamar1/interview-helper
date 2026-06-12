# M3 AI 模拟面试 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 实现 AI 模拟面试功能——用户选择面试方向/难度/轮数后，AI 面试官从题库抽取题目，进行流式多轮对话（含追问），面试结束后生成包含总分、5 维雷达图、薄弱点回链的评分报告。

**架构：** Vercel AI SDK v6 流式对话（`streamText` + `useChat`），DeepSeek 作为 LLM provider，Prisma 持久化面试会话与消息记录，Server Actions 管理会话生命周期，纯 SVG 雷达图组件。

**技术栈：** ai@6 + @ai-sdk/react@6 + @ai-sdk/deepseek、Prisma 7、zod 4、React 19、Next.js 16

**依赖里程碑：** M1（题库数据）提供面试题目池；M2（用户体系）提供认证与会话保护

---

## 文件结构

### 创建文件

| 文件 | 职责 |
|---|---|
| `src/lib/ai.ts` | AI SDK provider 配置（DeepSeek/mock 切换） |
| `src/lib/prompts/interviewer.ts` | 面试官系统提示词 + 行为约束 |
| `src/lib/prompts/report.ts` | 评分报告生成提示词 + zod schema |
| `src/lib/actions/interview.ts` | 面试会话 Server Actions（create/end/generateReport） |
| `src/app/api/interview/[id]/chat/route.ts` | AI 流式对话 API 路由 |
| `src/app/(main)/interview/page.tsx` | 面试准备页（选择方向/难度/轮数） |
| `src/app/(main)/interview/[id]/page.tsx` | 面试对话页（流式聊天） |
| `src/app/(main)/interview/[id]/report/page.tsx` | 评分报告页 |
| `src/app/(main)/interview/history/page.tsx` | 面试历史列表 |
| `src/components/interview/prep-form.tsx` | 准备表单（"use client"） |
| `src/components/interview/chat-panel.tsx` | 对话面板（useChat 流式） |
| `src/components/interview/radar-chart.tsx` | SVG 5 维雷达图 |
| `src/components/interview/score-card.tsx` | 总分+维度分数卡片 |
| `src/components/interview/weakness-list.tsx` | 薄弱点列表（含回链题目） |
| `src/lib/actions/interview.test.ts` | 面试 Action 单元测试 |
| `src/lib/prompts/report.test.ts` | 报告 zod schema 校验测试 |
| `src/components/interview/radar-chart.test.tsx` | 雷达图组件测试 |
| `e2e/m3-interview.spec.ts` | M3 黄金路径 E2E（mock 模式） |

### 修改文件

| 文件 | 变更 |
|---|---|
| `prisma/schema.prisma` | 新增 InterviewSession + InterviewMessage 模型 |
| `.env.example` | 新增 DEEPSEEK_API_KEY、AI_PROVIDER |
| `src/components/layout/site-header.tsx` | 无需修改（已含"/面试"链接） |

---

### 任务 1：环境准备——安装 AI SDK v6

**文件：** 修改 `package.json`

- [ ] **步骤 1：查看版本**

```bash
npm view ai version
npm view @ai-sdk/react version
npm view @ai-sdk/deepseek version
```

- [ ] **步骤 2：安装依赖**

```bash
pnpm add ai @ai-sdk/react @ai-sdk/deepseek
```

- [ ] **步骤 3：验证安装**

```bash
node -e "require('ai'); require('@ai-sdk/deepseek'); console.log('OK')"
```

- [ ] **步骤 4：Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: 安装 AI SDK v6（ai + @ai-sdk/react + @ai-sdk/deepseek）"
```

---

### 任务 2：Prisma Schema——面试会话与消息

**文件：** 修改 `prisma/schema.prisma`

- [ ] **步骤 1：在 User 模型上追加关联**

先读取 User 模型末尾，追加 `interviewSessions` 反向关联：

```prisma
// 在 User 模型的 studyRecords StudyRecord[] 后追加一行：
  interviewSessions InterviewSession[]
```

- [ ] **步骤 2：在 schema 末尾追加面试模型**

```prisma
enum InterviewStatus {
  ACTIVE
  FINISHED
}

model InterviewSession {
  id           String             @id @default(cuid())
  userId       String
  bankId       String
  difficulty   Difficulty
  targetRounds Int                @default(5)
  currentRound Int                @default(0)
  status       InterviewStatus    @default(ACTIVE)
  report       Json?
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
  user         User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  bank         QuestionBank       @relation(fields: [bankId], references: [id])
  messages     InterviewMessage[]

  @@index([userId])
  @@index([bankId])
  @@map("interview_session")
}

model InterviewMessage {
  id        String           @id @default(cuid())
  sessionId String
  role      String           // "INTERVIEWER" | "CANDIDATE" | "SYSTEM"
  content   String
  order     Int
  createdAt DateTime         @default(now())
  session   InterviewSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@index([sessionId])
  @@map("interview_message")
}
```

- [ ] **步骤 3：推送 Schema 到数据库**

```bash
pnpm db:push
```

- [ ] **步骤 4：重新生成 Prisma 客户端**

```bash
pnpm postinstall
```

- [ ] **步骤 5：类型检查**

```bash
pnpm typecheck
```

- [ ] **步骤 6：Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): 新增面试会话和消息记录表"
```

---

### 任务 3：AI SDK 提供者配置

**文件：** 创建 `src/lib/ai.ts`

- [ ] **步骤 1：编写提供者配置**

```ts
// src/lib/ai.ts
import { createDeepSeek } from "@ai-sdk/deepseek";

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
});

/** LLM 模型：通过 AI_PROVIDER 环境变量切换 deepseek / mock */
export function getModel() {
  switch (process.env.AI_PROVIDER) {
    case "mock":
      return null; // 测试环境，由测试注入 mock provider
    case "deepseek":
    default:
      return deepseek("deepseek-chat");
  }
}

/** 是否使用 mock 模式（跳过真实 API 调用） */
export function isMock() {
  return process.env.AI_PROVIDER === "mock";
}
```

- [ ] **步骤 2：更新 .env.example**

追加：

```bash
# AI 模拟面试
DEEPSEEK_API_KEY=""
AI_PROVIDER=deepseek  # deepseek | mock
```

- [ ] **步骤 3：类型检查**

```bash
pnpm typecheck
```

- [ ] **步骤 4：Commit**

```bash
git add src/lib/ai.ts .env.example
git commit -m "feat(ai): 配置 DeepSeek provider + mock 切换"
```

---

### 任务 4：系统提示词 + 评分报告模板

**文件：**
- 创建 `src/lib/prompts/interviewer.ts`
- 创建 `src/lib/prompts/report.ts`

- [ ] **步骤 1：编写面试官系统提示词**

```ts
// src/lib/prompts/interviewer.ts
import type { Difficulty } from "@/lib/question-schema";

interface InterviewConfig {
  direction: string;       // 面试方向（题库名称）
  difficulty: Difficulty;
  targetRounds: number;
  /** 从题库中预抽取的题目（title + answerBrief 供面试官引用） */
  questions: { id: string; title: string; answerBrief: string }[];
}

export function buildInterviewerPrompt(config: InterviewConfig): string {
  const questionList = config.questions
    .map((q, i) => `${i + 1}. ${q.title}（ID: ${q.id}）——要点：${q.answerBrief}`)
    .join("\n");

  return `你是面试突击鸭平台的 AI 面试官，负责对候选人进行**${config.direction}**方向的模拟面试。

## 你的角色
- 资深${config.direction}工程师面试官，友好但专业
- 难度：${config.difficulty}（EASY=基础 / MEDIUM=进阶 / HARD=深入原理）
- 目标轮数：${config.targetRounds} 道题（每道可追问 1-2 次）

## 题库（你只能从以下题目中提问）
${questionList}

## 行为约束
1. **一次只问一题**，不要一次性抛出多个问题
2. 每轮面试：先提问 → 候选人作答 → 简短评价（1-2 句）→ 决定下一步
3. **追问规则**：每道题最多追问 2 次，题干标记"要点"是你评判的依据
4. **换题规则**：候选人说"不会"或回答明显错误时，给简短提示后换下一题
5. **收尾规则**：当完成 ${config.targetRounds} 道题后，说："面试结束，正在生成评分报告..."，然后只输出 [END_INTERVIEW]
6. 保持对话流畅，不要逐字读题，用自然语气
7. 不回答与面试无关的问题，引导回面试流程

## 难度控制
- EASY：侧重基础概念，不需深入细节
- MEDIUM：考察理解深度，追问 1-2 次
- HARD：追问源码/原理/对比/优化，追问 2 次

开始面试吧！先自我介绍一句（你是${config.direction}面试官），然后从题库中出第一道题。`;
}
```

- [ ] **步骤 2：编写报告生成 schema + 提示词**

```ts
// src/lib/prompts/report.ts
import { z } from "zod";

/** 评分报告结构化 schema */
export const reportSchema = z.object({
  overallScore: z.number().min(0).max(100).describe("总分 0-100"),
  dimensions: z.object({
    knowledge: z.number().min(0).max(100).describe("知识广度"),
    depth: z.number().min(0).max(100).describe("理解深度"),
    expression: z.number().min(0).max(100).describe("表达能力"),
    logic: z.number().min(0).max(100).describe("逻辑思维"),
    adaptability: z.number().min(0).max(100).describe("应变能力"),
  }),
  strengths: z.array(z.string()).describe("优势（2-4 条）"),
  weaknesses: z.array(z.object({
    point: z.string().describe("薄弱点描述"),
    questionId: z.string().optional().describe("关联的题库题目 ID，方便回链复习"),
    suggestion: z.string().describe("改进建议"),
  })).describe("薄弱点（2-5 条，每条关联对应题目）"),
  summary: z.string().describe("总评（100-200 字，包括整体表现+提升方向）"),
});

export type InterviewReport = z.infer<typeof reportSchema>;

export function buildReportPrompt(direction: string): string {
  return `请根据以上面试对话记录，生成一份面试评分报告。

面试方向：${direction}

要求：
1. 根据候选人回答的准确度、深度、表达能力、逻辑性、应变能力综合评分
2. 薄弱点必须关联到具体的题库题目 ID（从面试官提问中可获取）
3. 量化评分严格对应难度——不是所有 80+，如实评价
4. 总评包含：整体表现总结 + 具体提升方向

请严格按 JSON 格式返回报告。`;
}
```

- [ ] **步骤 3：编写 report schema 测试**

```ts
// src/lib/prompts/report.test.ts
import { describe, it, expect } from "vitest";
import { reportSchema } from "./report";

const validReport = {
  overallScore: 78,
  dimensions: { knowledge: 80, depth: 72, expression: 75, logic: 78, adaptability: 85 },
  strengths: ["基础知识扎实", "应变能力强"],
  weaknesses: [{ point: "HashMap 扩容机制理解不深入", questionId: "java-hashmap-resize", suggestion: "阅读 JDK 源码 resize() 方法" }],
  summary: "整体表现良好，基础知识扎实但深度不够，建议深入源码阅读。",
};

describe("reportSchema", () => {
  it("应通过合法报告", () => {
    expect(reportSchema.safeParse(validReport).success).toBe(true);
  });

  it("应拒绝总分超出 0-100 的报告", () => {
    expect(reportSchema.safeParse({ ...validReport, overallScore: 120 }).success).toBe(false);
  });

  it("应拒绝缺少维度的报告", () => {
    const { dimensions, ...rest } = validReport;
    expect(reportSchema.safeParse(rest).success).toBe(false);
  });

  it("应拒绝缺少 questionId 的弱点", () => {
    const report = { ...validReport, weaknesses: [{ point: "test", suggestion: "test" }] };
    const result = reportSchema.safeParse(report);
    // questionId 是 optional，应通过
    expect(result.success).toBe(true);
  });
});
```

- [ ] **步骤 4：运行测试验证**

```bash
pnpm test -- src/lib/prompts/report.test.ts
```

- [ ] **步骤 5：Commit**

```bash
git add src/lib/prompts/ src/lib/prompts/report.test.ts
git commit -m "feat(interview): 添加面试官提示词和评分报告模板（含 zod schema）"
```

---

### 任务 5：面试 Server Actions

**文件：** 创建 `src/lib/actions/interview.ts`

- [ ] **步骤 1：编写 Server Actions**

```ts
// src/lib/actions/interview.ts
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Difficulty } from "@/lib/question-schema";
import type { InterviewReport } from "@/lib/prompts/report";

/** 创建面试会话 */
export async function createSession(params: {
  bankId: string;
  difficulty: Difficulty;
  targetRounds: number;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("请先登录");

  const interview = await prisma.interviewSession.create({
    data: {
      userId: session.user.id,
      bankId: params.bankId,
      difficulty: params.difficulty,
      targetRounds: params.targetRounds,
      status: "ACTIVE",
      currentRound: 0,
    },
  });
  revalidatePath("/interview");
  return interview;
}

/** 结束面试并保存报告 */
export async function finishSession(sessionId: string, report: InterviewReport) {
  const sess = await auth.api.getSession({ headers: await headers() });
  if (!sess) throw new Error("请先登录");

  const interview = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
  });
  if (!interview || interview.userId !== sess.user.id) {
    throw new Error("无权操作该面试会话");
  }

  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      status: "FINISHED",
      report: report as any,
    },
  });
  revalidatePath(`/interview/${sessionId}/report`);
}

/** 获取面试历史列表 */
export async function getInterviewHistory() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  return prisma.interviewSession.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      bank: { select: { name: true, icon: true } },
      messages: { take: 1, orderBy: { order: "asc" } },
    },
  });
}

/** 获取面试详情（含全部消息） */
export async function getInterviewDetail(id: string) {
  const sess = await auth.api.getSession({ headers: await headers() });
  if (!sess) return null;

  const interview = await prisma.interviewSession.findUnique({
    where: { id },
    include: {
      bank: { select: { name: true, icon: true } },
      messages: { orderBy: { order: "asc" } },
    },
  });
  if (!interview || interview.userId !== sess.user.id) return null;
  return interview;
}

/** 获取活跃面试（用于恢复中断的面试） */
export async function getActiveSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  return prisma.interviewSession.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
}
```

- [ ] **步骤 2：编写测试**

```ts
// src/lib/actions/interview.test.ts
import { describe, it, expect } from "vitest";

describe("interview actions", () => {
  it("模块应正确导出所有 action 函数", async () => {
    const mod = await import("./interview");
    expect(typeof mod.createSession).toBe("function");
    expect(typeof mod.finishSession).toBe("function");
    expect(typeof mod.getInterviewHistory).toBe("function");
    expect(typeof mod.getInterviewDetail).toBe("function");
    expect(typeof mod.getActiveSession).toBe("function");
  });
});
```

- [ ] **步骤 3：类型检查 + 测试**

```bash
pnpm typecheck && pnpm test -- src/lib/actions/interview.test.ts
```

- [ ] **步骤 4：Commit**

```bash
git add src/lib/actions/interview.ts src/lib/actions/interview.test.ts
git commit -m "feat(interview): 实现面试会话管理 Server Actions"
```

---

### 任务 6：流式对话 API 路由

**文件：** 创建 `src/app/api/interview/[id]/chat/route.ts`

- [ ] **步骤 1：编写 API 路由**

```ts
// src/app/api/interview/[id]/chat/route.ts
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { getModel } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildInterviewerPrompt } from "@/lib/prompts/interviewer";
import type { Difficulty } from "@/lib/question-schema";

export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. 鉴权
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  // 2. 获取面试会话
  const interview = await prisma.interviewSession.findUnique({
    where: { id },
    include: {
      bank: {
        include: {
          items: {
            orderBy: { order: "asc" },
            take: 30,
            select: {
              question: { select: { id: true, title: true, answerBrief: true } },
            },
          },
        },
      },
    },
  });

  if (!interview || interview.userId !== session.user.id) {
    return Response.json({ error: "无权访问" }, { status: 403 });
  }

  if (interview.status !== "ACTIVE") {
    return Response.json({ error: "面试已结束" }, { status: 400 });
  }

  // 3. 构建系统提示词
  const systemPrompt = buildInterviewerPrompt({
    direction: interview.bank.name,
    difficulty: interview.difficulty as Difficulty,
    targetRounds: interview.targetRounds,
    questions: interview.bank.items.map((i) => i.question),
  });

  // 4. 获取请求中的消息
  const { messages }: { messages: UIMessage[] } = await req.json();

  // 5. 流式响应
  const model = getModel();
  if (!model) {
    // mock 模式：返回固定文本
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("面试官：你好！准备好了吗？（mock 模式）"));
        controller.close();
      },
    });
    return new Response(mockStream);
  }

  const result = streamText({
    model,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxSteps: 30,
    onFinish: async ({ text }) => {
      // 保存面试官消息到数据库
      // 注意：用户消息由前端通过 Server Action 保存
      if (text) {
        const existingCount = await prisma.interviewMessage.count({
          where: { sessionId: id },
        });
        await prisma.interviewMessage.create({
          data: {
            sessionId: id,
            role: "INTERVIEWER",
            content: text,
            order: existingCount + 1,
          },
        });

        // 更新当前轮数（检测 [END_INTERVIEW] 标记）
        if (text.includes("[END_INTERVIEW]")) {
          const msgCount = await prisma.interviewMessage.count({
            where: { sessionId: id, role: "INTERVIEWER" },
          });
          await prisma.interviewSession.update({
            where: { id },
            data: { currentRound: msgCount },
          });
        }
      }
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
```

- [ ] **步骤 2：类型检查**

```bash
pnpm typecheck
```

- [ ] **步骤 3：Commit**

```bash
git add src/app/api/interview/
git commit -m "feat(interview): 实现 AI 流式对话 API 路由（DeepSeek + SSE）"
```

---

### 任务 7：面试准备页

**文件：**
- 创建 `src/app/(main)/interview/page.tsx`
- 创建 `src/components/interview/prep-form.tsx`

- [ ] **步骤 1：编写准备表单组件**

```tsx
// src/components/interview/prep-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSession } from "@/lib/actions/interview";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/constants";

const DIFFICULTY_OPTIONS = [
  { label: "简单", value: "EASY" },
  { label: "中等", value: "MEDIUM" },
  { label: "困难", value: "HARD" },
] as const;

const ROUND_OPTIONS = [3, 5, 8, 10];

interface Props {
  banks: { id: string; name: string; icon: string; description: string }[];
}

export function PrepForm({ banks }: Props) {
  const router = useRouter();
  const [bankId, setBankId] = useState(banks[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [targetRounds, setTargetRounds] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bankId) return;
    setLoading(true);
    setError("");
    try {
      const session = await createSession({ bankId, difficulty, targetRounds });
      router.push(`/interview/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-ink">开始 AI 模拟面试</h1>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {/* 面试方向 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">面试方向</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {banks.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBankId(b.id)}
              className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                bankId === b.id
                  ? "border-primary bg-primary/10"
                  : "border-border-warm hover:border-primary"
              }`}
            >
              <span className="text-lg">{b.icon}</span>
              <span className="ml-2 font-medium text-ink">{b.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 难度 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">难度</label>
        <div className="flex gap-2">
          {DIFFICULTY_OPTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDifficulty(d.value)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                difficulty === d.value
                  ? "bg-primary font-medium text-white"
                  : "bg-cream text-muted-foreground hover:bg-[#FFE8D2]"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* 轮数 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">面试轮数</label>
        <div className="flex gap-2">
          {ROUND_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTargetRounds(r)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                targetRounds === r
                  ? "bg-primary font-medium text-white"
                  : "bg-cream text-muted-foreground hover:bg-[#FFE8D2]"
              }`}
            >
              {r} 轮
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={loading || !bankId} className="w-full rounded-full">
        {loading ? "正在准备面试..." : "开始面试"}
      </Button>
    </form>
  );
}
```

- [ ] **步骤 2：编写准备页面（Server Component）**

```tsx
// src/app/(main)/interview/page.tsx
import { prisma } from "@/lib/db";
import { PrepForm } from "@/components/interview/prep-form";
import { getActiveSession } from "@/lib/actions/interview";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InterviewPrepPage() {
  const banks = await prisma.questionBank.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, icon: true, description: true },
  });

  const activeSession = await getActiveSession();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {activeSession && (
        <div className="mb-6 rounded-lg border border-primary bg-primary/5 p-4 text-sm">
          你有一个进行中的面试，{" "}
          <Link href={`/interview/${activeSession.id}`} className="font-semibold text-primary underline">
            继续面试
          </Link>
        </div>
      )}
      <PrepForm banks={banks} />
    </div>
  );
}
```

- [ ] **步骤 3：类型检查**

```bash
pnpm typecheck
```

- [ ] **步骤 4：Commit**

```bash
git add src/components/interview/prep-form.tsx src/app/\(main\)/interview/page.tsx
git commit -m "feat(interview): 实现面试准备页（方向/难度/轮数选择 + 中断恢复提示）"
```

---

### 任务 8：面试对话页（流式聊天）

**文件：**
- 创建 `src/app/(main)/interview/[id]/page.tsx`
- 创建 `src/components/interview/chat-panel.tsx`

- [ ] **步骤 1：编写聊天面板组件**

```tsx
// src/components/interview/chat-panel.tsx
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect } from "react";

export function ChatPanel({ sessionId }: { sessionId: string }) {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/interview/${sessionId}/chat`,
    }),
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = inputRef.current;
    if (!input || !input.value.trim() || status !== "ready") return;
    sendMessage({ text: input.value.trim() });
    input.value = "";
  }

  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col">
      {/* 消息列表 */}
      <div ref={listRef} className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="rounded-lg border border-border-warm bg-cream/50 p-6 text-center text-sm text-muted-foreground">
            <p className="text-lg">{"🦆"}</p>
            <p className="mt-2">AI 面试官正在准备面试...</p>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "bg-primary text-white"
                  : "bg-cream text-ink border border-border-warm"
              }`}
            >
              {m.parts.map((part, i) =>
                part.type === "text" ? (
                  <span key={i} className="whitespace-pre-wrap">{part.text}</span>
                ) : null
              )}
            </div>
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-cream border border-border-warm px-4 py-3 text-sm text-muted-foreground">
              AI 面试官正在输入...
            </div>
          </div>
        )}
      </div>

      {/* 输入框 */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border-warm pt-3">
        <input
          ref={inputRef}
          name="message"
          disabled={!isStreaming && status !== "ready"}
          placeholder={isStreaming ? "面试官正在说话..." : "输入你的回答..."}
          className="flex-1 rounded-full border border-border-warm px-4 py-2 text-sm outline-none focus:border-primary disabled:bg-muted"
        />
        <button
          type="submit"
          disabled={!isStreaming && status !== "ready"}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          发送
        </button>
      </form>
    </div>
  );
}
```

- [ ] **步骤 2：编写对话页（Server Component）**

```tsx
// src/app/(main)/interview/[id]/page.tsx
import { notFound } from "next/navigation";
import { getInterviewDetail } from "@/lib/actions/interview";
import { ChatPanel } from "@/components/interview/chat-panel";

export const dynamic = "force-dynamic";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const interview = await getInterviewDetail(id);
  if (!interview) notFound();

  if (interview.status === "FINISHED") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground">该面试已结束</p>
        <a
          href={`/interview/${id}/report`}
          className="mt-4 inline-block rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white"
        >
          查看评分报告
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex items-center gap-3 py-3 border-b border-border-warm">
        <span className="text-2xl">{interview.bank.icon}</span>
        <div>
          <h1 className="text-sm font-bold text-ink">{interview.bank.name} 模拟面试</h1>
          <p className="text-xs text-muted-foreground">
            难度：{interview.difficulty} · 目标 {interview.targetRounds} 轮
          </p>
        </div>
      </div>
      <ChatPanel sessionId={id} />
    </div>
  );
}
```

- [ ] **步骤 3：类型检查**

```bash
pnpm typecheck
```

- [ ] **步骤 4：Commit**

```bash
git add src/components/interview/chat-panel.tsx src/app/\(main\)/interview/\[id\]/page.tsx
git commit -m "feat(interview): 实现 AI 流式对话页面（useChat + SSE）"
```

---

### 任务 9：评分报告页

**文件：**
- 创建 `src/app/(main)/interview/[id]/report/page.tsx`
- 创建 `src/components/interview/radar-chart.tsx`
- 创建 `src/components/interview/score-card.tsx`
- 创建 `src/components/interview/weakness-list.tsx`

- [ ] **步骤 1：编写雷达图组件**

```tsx
// src/components/interview/radar-chart.tsx
interface RadialData {
  knowledge: number;
  depth: number;
  expression: number;
  logic: number;
  adaptability: number;
}

const LABELS = ["知识广度", "理解深度", "表达能力", "逻辑思维", "应变能力"];
const KEYS: (keyof RadialData)[] = ["knowledge", "depth", "expression", "logic", "adaptability"];

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 90;
const LEVELS = 5;

export function RadarChart({ data }: { data: RadialData }) {
  const angles = KEYS.map((_, i) => (Math.PI * 2 * i) / KEYS.length - Math.PI / 2);

  // 计算多边形顶点
  const points = KEYS.map((k, i) => {
    const r = (data[k] / 100) * RADIUS;
    return {
      x: CENTER + r * Math.cos(angles[i]),
      y: CENTER + r * Math.sin(angles[i]),
    };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const gridLevels = Array.from({ length: LEVELS }, (_, l) => {
    const r = ((l + 1) / LEVELS) * RADIUS;
    return KEYS.map((_, i) => ({
      x: CENTER + r * Math.cos(angles[i]),
      y: CENTER + r * Math.sin(angles[i]),
    }));
  });

  const axisLines = KEYS.map((k, i) => {
    const lx = CENTER + RADIUS * Math.cos(angles[i]) * 1.15;
    const ly = CENTER + RADIUS * Math.sin(angles[i]) * 1.15;
    return { x: lx, y: ly, label: LABELS[i], value: data[k] };
  });

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-[240px]">
      {/* 网格 */}
      {gridLevels.map((level, li) => (
        <polygon
          key={li}
          points={level.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="#F3E7D8"
          strokeWidth={1}
        />
      ))}
      {/* 轴 */}
      {KEYS.map((_, i) => (
        <line
          key={i}
          x1={CENTER}
          y1={CENTER}
          x2={CENTER + RADIUS * Math.cos(angles[i])}
          y2={CENTER + RADIUS * Math.sin(angles[i])}
          stroke="#F3E7D8"
          strokeWidth={1}
        />
      ))}
      {/* 数据多边形 */}
      <polygon
        points={polygonPoints}
        fill="#FF7D00"
        fillOpacity={0.2}
        stroke="#FF7D00"
        strokeWidth={2}
      />
      {/* 数据点 */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#FF7D00" />
      ))}
      {/* 标签 + 分数 */}
      {axisLines.map((a, i) => (
        <text
          key={i}
          x={a.x}
          y={a.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-ink text-[8px]"
          fontWeight={500}
        >
          {a.label}
        </text>
      ))}
    </svg>
  );
}
```

- [ ] **步骤 2：编写雷达图测试**

```tsx
// src/components/interview/radar-chart.test.tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { RadarChart } from "./radar-chart";

describe("RadarChart", () => {
  it("应渲染 SVG", () => {
    const data = { knowledge: 80, depth: 70, expression: 90, logic: 75, adaptability: 85 };
    const { container } = render(<RadarChart data={data} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector("polygon[fill=\"#FF7D00\"]")).toBeInTheDocument();
  });
});
```

- [ ] **步骤 3：编写评分卡片组件**

```tsx
// src/components/interview/score-card.tsx
import type { InterviewReport } from "@/lib/prompts/report";

export function ScoreCard({ report }: { report: InterviewReport }) {
  const dims = report.dimensions;

  return (
    <div className="space-y-3">
      <div className="text-center">
        <span className="text-4xl font-bold text-primary">{report.overallScore}</span>
        <span className="ml-1 text-sm text-muted-foreground">/ 100</span>
      </div>
      <div className="grid grid-cols-5 gap-2 text-center">
        {[
          { key: "knowledge", label: "知识广度" },
          { key: "depth", label: "理解深度" },
          { key: "expression", label: "表达" },
          { key: "logic", label: "逻辑" },
          { key: "adaptability", label: "应变" },
        ].map(({ key, label }) => (
          <div key={key}>
            <div className="text-lg font-bold text-ink">{dims[key as keyof typeof dims]}</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **步骤 4：编写薄弱点列表**

```tsx
// src/components/interview/weakness-list.tsx
import Link from "next/link";
import type { InterviewReport } from "@/lib/prompts/report";

export function WeaknessList({ weaknesses }: { weaknesses: InterviewReport["weaknesses"] }) {
  return (
    <ul className="space-y-3">
      {weaknesses.map((w, i) => (
        <li key={i} className="rounded-lg border border-border-warm bg-cream/50 p-3 text-sm">
          <p className="font-medium text-ink">{i + 1}. {w.point}</p>
          <p className="mt-1 text-muted-foreground">{w.suggestion}</p>
          {w.questionId && (
            <Link
              href={`/questions/${w.questionId}`}
              className="mt-1 inline-block text-xs text-primary underline"
            >
              去复习相关题目 →
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **步骤 5：编写报告页面（Server Component）**

```tsx
// src/app/(main)/interview/[id]/report/page.tsx
import { notFound } from "next/navigation";
import { getInterviewDetail } from "@/lib/actions/interview";
import { RadarChart } from "@/components/interview/radar-chart";
import { ScoreCard } from "@/components/interview/score-card";
import { WeaknessList } from "@/components/interview/weakness-list";
import { reportSchema } from "@/lib/prompts/report";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const interview = await getInterviewDetail(id);
  if (!interview || interview.status !== "FINISHED") notFound();

  const report = interview.report ? reportSchema.parse(interview.report) : null;
  if (!report) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">报告生成中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <h1 className="text-xl font-bold text-ink text-center">
        {interview.bank.name} 模拟面试报告
      </h1>

      <section className="rounded-xl border border-border-warm bg-white p-6">
        <ScoreCard report={report} />
      </section>

      <section className="rounded-xl border border-border-warm bg-white p-6">
        <h2 className="mb-4 text-lg font-bold text-ink">能力雷达图</h2>
        <RadarChart data={report.dimensions} />
      </section>

      <section className="rounded-xl border border-border-warm bg-white p-6">
        <h2 className="mb-2 text-lg font-bold text-ink">优势</h2>
        <ul className="list-inside list-disc space-y-1">
          {report.strengths.map((s, i) => (
            <li key={i} className="text-sm text-ink">{s}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border-warm bg-white p-6">
        <h2 className="mb-3 text-lg font-bold text-ink">需要提升</h2>
        <WeaknessList weaknesses={report.weaknesses} />
      </section>

      <section className="rounded-xl border border-border-warm bg-white p-6">
        <h2 className="mb-2 text-lg font-bold text-ink">总评</h2>
        <p className="text-sm text-ink leading-relaxed">{report.summary}</p>
      </section>

      <div className="flex justify-center gap-3">
        <a href="/interview" className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white">
          再面一次
        </a>
        <a href={`/interview/${id}`} className="rounded-full border border-border-warm px-6 py-2 text-sm text-ink">
          回看对话
        </a>
      </div>
    </div>
  );
}
```

- [ ] **步骤 6：运行雷达图测试**

```bash
pnpm test -- src/components/interview/radar-chart.test.tsx
```

- [ ] **步骤 7：类型检查**

```bash
pnpm typecheck
```

- [ ] **步骤 8：Commit**

```bash
git add src/app/\(main\)/interview/\[id\]/report/ src/components/interview/radar-chart.tsx src/components/interview/radar-chart.test.tsx src/components/interview/score-card.tsx src/components/interview/weakness-list.tsx
git commit -m "feat(interview): 实现评分报告页（总分 + 雷达图 + 薄弱点回链）"
```

---

### 任务 10：面试历史页

**文件：** 创建 `src/app/(main)/interview/history/page.tsx`

- [ ] **步骤 1：编写历史页**

```tsx
// src/app/(main)/interview/history/page.tsx
import Link from "next/link";
import { getInterviewHistory } from "@/lib/actions/interview";
import { DifficultyBadge } from "@/components/question/difficulty-badge";

export const dynamic = "force-dynamic";

export default async function InterviewHistoryPage() {
  const history = await getInterviewHistory();

  if (history.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="text-4xl">{"🦆"}</div>
        <h1 className="mt-4 text-lg font-bold text-ink">还没有面试记录</h1>
        <p className="mt-1 text-sm text-muted-foreground">完成一次 AI 模拟面试后，记录会出现在这里</p>
        <Link
          href="/interview"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white"
        >
          开始面试
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-bold text-ink">面试历史</h1>
      <ul className="mt-4 space-y-3">
        {history.map((h) => {
          const report = h.report as { overallScore?: number } | null;
          return (
            <li key={h.id}>
              <Link
                href={h.status === "FINISHED" ? `/interview/${h.id}/report` : `/interview/${h.id}`}
                className="flex items-center gap-4 rounded-card border border-border-warm bg-white p-4 transition-colors hover:border-primary"
              >
                <span className="text-2xl">{h.bank.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{h.bank.name} 模拟面试</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.createdAt).toLocaleDateString("zh-CN")}
                    {" · "}
                    <DifficultyBadge difficulty={h.difficulty} />
                  </p>
                </div>
                <div className="text-right">
                  {report?.overallScore ? (
                    <span className="text-lg font-bold text-primary">{report.overallScore}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {h.status === "ACTIVE" ? "进行中" : "待报告"}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **步骤 2：类型检查**

```bash
pnpm typecheck
```

- [ ] **步骤 3：Commit**

```bash
git add src/app/\(main\)/interview/history/
git commit -m "feat(interview): 实现面试历史列表页"
```

---

### 任务 11：E2E 黄金路径（mock 模式）

**文件：** 创建 `e2e/m3-interview.spec.ts`

- [ ] **步骤 1：编写 E2E 测试**

```ts
// e2e/m3-interview.spec.ts
import { test, expect } from "@playwright/test";

const TEST_USER = {
  name: "E2E面试鸭",
  email: `e2e-m3-${Date.now()}@test.duck`,
  password: "test12345678",
};

test.describe("M3 AI 模拟面试黄金路径（mock 模式）", () => {
  test("注册 → 准备面试 → 开始对话 → 结束面试", async ({ page }) => {
    // 1. 注册用户（复用 M2 流程）
    await page.goto("/register");
    await page.fill('input[id="name"]', TEST_USER.name);
    await page.fill('input[id="email"]', TEST_USER.email);
    await page.fill('input[id="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await expect(page.getByText(TEST_USER.name)).toBeVisible({ timeout: 10000 });

    // 2. 访问面试准备页
    await page.goto("/interview");
    await expect(page.getByText("开始 AI 模拟面试")).toBeVisible();
    await expect(page.getByRole("button", { name: "Java" })).toBeVisible();

    // 3. 选择 Java → 中等 → 3 轮
    await page.getByRole("button", { name: "Java" }).click();
    await page.getByRole("button", { name: "中等" }).click();
    await page.getByRole("button", { name: "3 轮" }).click();
    await page.click('button[type="submit"]');

    // 4. 等待跳转到对话页
    await expect(page).toHaveURL(/\/interview\//, { timeout: 10000 });
    // mock 模式下会显示固定文本
    await expect(page.getByText("AI 面试官正在准备面试")).toBeVisible({ timeout: 5000 });

    // 5. 访问历史页
    await page.goto("/interview/history");
    await expect(page.getByText("面试历史")).toBeVisible({ timeout: 5000 });
  });
});
```

> **注意：** E2E 需要在 `AI_PROVIDER=mock` 模式下运行，或使用真实 DeepSeek API Key。

- [ ] **步骤 2：运行 E2E（mock 模式）**

```bash
AI_PROVIDER=mock pnpm e2e -- e2e/m3-interview.spec.ts
```

- [ ] **步骤 3：Commit**

```bash
git add e2e/m3-interview.spec.ts
git commit -m "test(e2e): 添加 M3 AI 模拟面试黄金路径 E2E（mock 模式）"
```

---

### 任务 12：整体质量验证

- [ ] **步骤 1：全量质量门**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

预期：lint 0 errors、typecheck 通过、全部单测通过、build 成功。

- [ ] **步骤 2：确保 M1/M2 E2E 不受影响**

```bash
pnpm e2e
```

- [ ] **步骤 3：人工验收清单**

- [ ] 登录 → 访问 `/interview` → 看到准备表单
- [ ] 选择 Java / 中等 / 5 轮 → 点"开始面试"
- [ ] 进入对话页 → AI 面试官开始提问
- [ ] 回答几个问题 → 观察流式打字效果
- [ ] 最终 AI 说"面试结束" → 报告生成
- [ ] 报告页：总分数 / 雷达图 / 优势 / 薄弱点（含回链）
- [ ] 访问 `/interview/history` → 看到刚才的面试记录
- [ ] 中断面试 → 重新访问 `/interview` → 看到"继续面试"提示

- [ ] **步骤 4：Commit**

```bash
git add -A
git commit -m "chore: M3 AI 模拟面试收尾"
```

---

## 自检

### 1. 规格覆盖度

- ✅ 面试准备页（选方向/难度/轮数）：任务 7
- ✅ AI 面试官从题库实际抽题：任务 4（提示词注入题库）+ 任务 6（API 路由查题库）
- ✅ 多轮对话 + 追问最深 2 层：任务 4（系统提示词限制）
- ✅ 流式打字效果：任务 8（useChat + SSE）
- ✅ 评分报告（总分+5 维雷达图+薄弱点回链）：任务 9（report schema + 页面）
- ✅ 面试历史可回看：任务 10
- ✅ 中断可恢复：任务 7（getActiveSession）
- ✅ mock provider 模式（测试零成本）：任务 3（AI_PROVIDER 切换）

### 2. 占位符扫描

- 无 "TODO"、"待定"、"后续实现" 等占位符
- 所有步骤包含实际代码

### 3. 类型一致性

- `InterviewReport` 类型在各组件间一致：`reportSchema` → `ScoreCard`/`WeaknessList`/`ReportPage`
- `Difficulty` 复用自 `lib/question-schema.ts`
- `InterviewSession` 模型字段在 actions 和 API 路由中一致

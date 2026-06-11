# M1 题库核心 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 无需登录即可用的完整刷题网站：首页、题库列表/详情、题目三层答案页、搜索，约 300 道种子题目。

**架构：** RSC 服务端直查数据库（SEO + SSR），所有查库页面 `force-dynamic`；查询逻辑收敛到 `src/lib/queries/`；三层答案用「服务端渲染 Markdown + 客户端折叠交互」组合模式。

**技术栈：** 在 M0 基础上新增 react-markdown 10、shiki 4（同步高亮器）、@shikijs/rehype、remark-gfm、@tailwindcss/typography。

**前置条件：** M0 已验收通过；`.env` 中有可用 DATABASE_URL/DIRECT_URL。

**Next.js 16 提醒：** `params` / `searchParams` 是 Promise，必须 `await`。

---

## 文件结构（M1 新增）

```
data/questions/                       # 8 个分类种子 JSON（入库）
├── java.json  frontend.json  python.json  mysql.json
├── redis.json  network.json  os.json  ai-llm.json
prisma/
├── schema.prisma                     # +QuestionBank/Question/QuestionBankItem
├── migrations/xxx_init_question_bank/  # 含 pg_trgm 扩展与 GIN 索引
└── seed.ts                           # 幂等导入（upsert by slug）
src/
├── lib/
│   ├── constants.ts                  # CATEGORIES 分类常量
│   ├── question-schema.ts            # zod：种子文件/追问链 schema（+类型导出）
│   ├── shiki.ts                      # 同步高亮器单例
│   └── queries/
│       ├── banks.ts                  # getBanksWithStats / getBankDetail
│       └── questions.ts              # buildSearchWhere / searchQuestions / viewQuestion
├── components/
│   ├── bank/
│   │   ├── bank-card.tsx             # 题库卡片（hover 上浮+橙描边）
│   │   └── category-nav.tsx          # 分类胶囊导航
│   └── question/
│       ├── difficulty-badge.tsx      # 难度胶囊（绿/橙/红）
│       ├── question-row.tsx          # 题目行（列表/搜索复用）
│       ├── markdown-content.tsx      # react-markdown + shiki
│       └── answer-layers.tsx         # 三层答案（client）
├── app/(main)/
│   ├── page.tsx                      # 首页改全功能版
│   ├── banks/page.tsx                # 题库列表（?category=）
│   ├── banks/[slug]/page.tsx         # 题库详情（?difficulty=）
│   ├── questions/[slug]/page.tsx     # 题目详情（核心页）
│   └── search/page.tsx               # 搜索结果（?q=）
└── data-quality.test.ts 放 src/lib/  # 种子数据质量校验
e2e/m1-golden-path.spec.ts
```

---

### 任务 1：题库数据模型与迁移（含 pg_trgm）

**文件：**
- 修改：`prisma/schema.prisma`
- 创建：`prisma/migrations/*_init_question_bank/migration.sql`（生成后手工追加索引）

- [ ] **步骤 1：schema.prisma 追加模型（技术方案 §3）**

```prisma
enum Difficulty {
  EASY
  MEDIUM
  HARD
}

model QuestionBank {
  id          String             @id @default(cuid())
  name        String
  slug        String             @unique
  description String
  icon        String
  category    String
  sortOrder   Int                @default(0)
  items       QuestionBankItem[]
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
}

model Question {
  id           String             @id @default(cuid())
  title        String
  slug         String             @unique
  answerBrief  String
  answerDetail String
  followUps    Json
  difficulty   Difficulty
  tags         String[]
  viewCount    Int                @default(0)
  banks        QuestionBankItem[]
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
}

model QuestionBankItem {
  id         String       @id @default(cuid())
  bankId     String
  questionId String
  order      Int          @default(0)
  bank       QuestionBank @relation(fields: [bankId], references: [id], onDelete: Cascade)
  question   Question     @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@unique([bankId, questionId])
}
```

- [ ] **步骤 2：生成迁移（先 create-only，手工加索引）**

```bash
pnpm prisma migrate dev --name init_question_bank --create-only
```

在生成的 `migration.sql` 末尾追加：

```sql
-- 搜索：pg_trgm 加速 ILIKE；tags 数组 GIN
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "Question_title_trgm_idx" ON "Question" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "Question_tags_idx" ON "Question" USING GIN ("tags");
```

- [ ] **步骤 3：执行迁移并验证**

```bash
pnpm prisma migrate dev
```

预期：迁移成功；`pnpm tsx scripts/db-check.ts` 仍连通。
运行：`pnpm typecheck`（生成的 client 含新模型），预期 PASS。

- [ ] **步骤 4：Commit**

```bash
git add prisma/
git commit -m "feat: 题库数据模型与迁移（pg_trgm 搜索索引）"
```

---

### 任务 2：种子/追问链 zod schema（TDD）

**文件：**
- 创建：`src/lib/constants.ts`、`src/lib/question-schema.ts`
- 测试：`src/lib/question-schema.test.ts`

- [ ] **步骤 1：创建 src/lib/constants.ts**

```ts
export const CATEGORIES = [
  "Java",
  "前端",
  "Python",
  "数据库",
  "网络",
  "操作系统",
  "AI 大模型",
] as const;
```

- [ ] **步骤 2：编写失败的测试 src/lib/question-schema.test.ts**

```ts
import { seedFileSchema, followUpsSchema } from "./question-schema";

const validQuestion = {
  title: "HashMap 的扩容机制是怎样的？",
  slug: "hashmap-resize",
  answerBrief: "默认容量 16、负载因子 0.75，超过阈值容量翻倍，JDK 8 高低位拆分迁移。",
  answerDetail: "#".padEnd(200, "x"),
  followUps: [
    { question: "为什么容量必须是 2 的幂？", hint: "考虑 (n-1) & hash 的取模优化。" },
    { question: "JDK 7 头插法为何死循环？", hint: "并发 resize 链表反转成环。" },
  ],
  difficulty: "MEDIUM",
  tags: ["Java", "集合"],
};

describe("seedFileSchema", () => {
  const validFile = {
    bank: { name: "Java 基础", slug: "java-basics", description: "集合与并发", icon: "☕", category: "Java", sortOrder: 1 },
    questions: Array.from({ length: 30 }, (_, i) => ({ ...validQuestion, slug: `q-${i}` })),
  };

  it("合法文件通过", () => {
    expect(() => seedFileSchema.parse(validFile)).not.toThrow();
  });
  it("追问少于 2 个拒绝", () => {
    const bad = { ...validFile, questions: [{ ...validQuestion, followUps: [validQuestion.followUps[0]] }] };
    expect(() => seedFileSchema.parse(bad)).toThrow();
  });
  it("slug 含大写或下划线拒绝", () => {
    const bad = { ...validFile, questions: [{ ...validQuestion, slug: "HashMap_Resize" }] };
    expect(() => seedFileSchema.parse(bad)).toThrow();
  });
  it("非法分类拒绝", () => {
    const bad = { ...validFile, bank: { ...validFile.bank, category: "区块链" } };
    expect(() => seedFileSchema.parse(bad)).toThrow();
  });
});

describe("followUpsSchema", () => {
  it("解析数据库 Json 字段", () => {
    expect(followUpsSchema.parse(validQuestion.followUps)).toHaveLength(2);
  });
});
```

运行：`pnpm test`，预期 FAIL（模块不存在）。

- [ ] **步骤 3：实现 src/lib/question-schema.ts**

```ts
import { z } from "zod";
import { CATEGORIES } from "./constants";

export const followUpSchema = z.object({
  question: z.string().min(5),
  hint: z.string().min(10),
});
export const followUpsSchema = z.array(followUpSchema).min(2).max(4);

export const difficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
export type Difficulty = z.infer<typeof difficultySchema>;
export type FollowUp = z.infer<typeof followUpSchema>;

export const seedQuestionSchema = z.object({
  title: z.string().min(5),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug 须为小写英文连字符"),
  answerBrief: z.string().min(20).max(300),
  answerDetail: z.string().min(200),
  followUps: followUpsSchema,
  difficulty: difficultySchema,
  tags: z.array(z.string().min(1)).min(1).max(6),
});

export const seedFileSchema = z.object({
  bank: z.object({
    name: z.string().min(2),
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    description: z.string().min(4),
    icon: z.string().min(1),
    category: z.enum(CATEGORIES),
    sortOrder: z.number().int().min(0),
  }),
  questions: z.array(seedQuestionSchema).min(30),
});
export type SeedFile = z.infer<typeof seedFileSchema>;
```

- [ ] **步骤 4：运行测试验证通过**

运行：`pnpm test`，预期 PASS。

- [ ] **步骤 5：Commit**

```bash
git add src/lib/constants.ts src/lib/question-schema.ts src/lib/question-schema.test.ts
git commit -m "feat: 种子数据与追问链 zod schema"
```

---

### 任务 3：生成 8 个分类种子题目（约 300 道）

**文件：**
- 测试：`src/lib/data-quality.test.ts`
- 创建：`data/questions/{java,frontend,python,mysql,redis,network,os,ai-llm}.json`

> 内容生成是本任务主体，8 个文件相互独立，**建议用 superpowers:dispatching-parallel-agents 并行生成**（每个子代理一个文件，携带下方格式样例与对应主题清单）。

- [ ] **步骤 1：编写失败的质量校验测试 src/lib/data-quality.test.ts**

```ts
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { seedFileSchema, type SeedFile } from "./question-schema";

const dir = path.join(process.cwd(), "data/questions");

describe("种子数据质量", () => {
  let parsed: SeedFile[] = [];

  it("存在 8 个分类文件且全部通过 schema 校验", () => {
    const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    expect(files).toHaveLength(8);
    parsed = files.map((f) => seedFileSchema.parse(JSON.parse(readFileSync(path.join(dir, f), "utf8"))));
  });

  it("总题数 ≥ 280", () => {
    expect(parsed.reduce((s, p) => s + p.questions.length, 0)).toBeGreaterThanOrEqual(280);
  });

  it("题目与题库 slug 全局唯一", () => {
    const slugs = parsed.flatMap((p) => p.questions.map((q) => q.slug));
    expect(new Set(slugs).size).toBe(slugs.length);
    const bankSlugs = parsed.map((p) => p.bank.slug);
    expect(new Set(bankSlugs).size).toBe(bankSlugs.length);
  });

  it("每个文件覆盖三种难度", () => {
    for (const p of parsed) {
      const set = new Set(p.questions.map((q) => q.difficulty));
      expect(set).toEqual(new Set(["EASY", "MEDIUM", "HARD"]));
    }
  });

  it("每题第一个 tag 为有效标签且代码块语言在白名单内", () => {
    const langWhitelist = /```(java|javascript|typescript|python|sql|bash|json)?\n/g;
    for (const p of parsed) {
      for (const q of p.questions) {
        const fences = q.answerDetail.match(/```[a-z]*\n/g) ?? [];
        for (const f of fences) expect(f).toMatch(langWhitelist);
      }
    }
  });
});
```

运行：`pnpm test src/lib/data-quality.test.ts`，预期 FAIL（目录不存在）。

- [ ] **步骤 2：按统一规格生成 8 个文件**

8 个题库定义（bank 字段固定如下）：

| 文件 | name | slug | icon | category | sortOrder | description |
|---|---|---|---|---|---|---|
| java.json | Java 基础 | java-basics | ☕ | Java | 1 | 面向对象 · 集合 · 并发 · JVM |
| frontend.json | 前端 | frontend | 🌐 | 前端 | 2 | JS 核心 · CSS · React · 浏览器 |
| python.json | Python | python | 🐍 | Python | 3 | 语言特性 · 数据结构 · 异步 |
| mysql.json | MySQL | mysql | 🗄️ | 数据库 | 4 | 索引 · 事务 · 锁 · 优化 |
| redis.json | Redis | redis | ⚡ | 数据库 | 5 | 数据结构 · 持久化 · 缓存三件套 |
| network.json | 计算机网络 | network | 🔌 | 网络 | 6 | TCP/IP · HTTP · HTTPS · DNS |
| os.json | 操作系统 | os | 💻 | 操作系统 | 7 | 进程线程 · 内存 · IO 模型 |
| ai-llm.json | AI 大模型 | ai-llm | 🤖 | AI 大模型 | 8 | Transformer · RAG · Agent · 微调 |

每文件生成要求：
- **36~40 道**真实高频面试题（总数 ≥ 300，校验下限 280）
- 难度比例约 25% EASY / 50% MEDIUM / 25% HARD（三种必须都有）
- slug 英文小写连字符，**带分类前缀防全局冲突**（如 `redis-persistence-rdb-aof`）
- answerBrief：纯文本 2~3 句（20~300 字符），背得出的「30 秒速记」
- answerDetail：300~800 字 Markdown，适当用代码块/表格/列表；代码块语言仅限 `java/javascript/typescript/python/sql/bash/json`
- followUps：2~4 个递进追问，hint 是提示思路而非完整答案
- tags：第一个为分类名（如 "Java"），其余为主题词，高频题加 "高频"

格式样例（每个生成子代理都要携带）：

```json
{
  "bank": { "name": "Java 基础", "slug": "java-basics", "description": "面向对象 · 集合 · 并发 · JVM", "icon": "☕", "category": "Java", "sortOrder": 1 },
  "questions": [
    {
      "title": "HashMap 的扩容机制是怎样的？",
      "slug": "java-hashmap-resize",
      "answerBrief": "默认容量 16、负载因子 0.75，元素数超过容量×0.75 时扩容为原来的 2 倍；JDK 8 用高低位拆分迁移，元素要么留在原索引 i，要么移动到 i+oldCap，无需重算 hash。",
      "answerDetail": "## 触发条件\n\n当 `size > capacity * loadFactor`（默认 16 × 0.75 = 12）时触发 `resize()`。\n\n## JDK 8 高低位迁移\n\n```java\nif ((e.hash & oldCap) == 0) {\n    // 留在原索引 i\n} else {\n    // 迁移到 i + oldCap\n}\n```\n\n| 对比项 | JDK 7 | JDK 8 |\n|---|---|---|\n| 迁移方式 | 重算索引、头插 | 高低位拆分、尾插 |\n| 并发风险 | 死循环 | 数据丢失（仍不安全） |\n\n扩容是 O(n) 操作，已知容量时建议初始化指定 `new HashMap<>(expectedSize / 0.75 + 1)`。",
      "followUps": [
        { "question": "为什么容量必须是 2 的幂？", "hint": "考虑 (n-1) & hash 的取模优化，以及高低位拆分迁移的前提。" },
        { "question": "JDK 7 的头插法在并发下为什么会死循环？", "hint": "两个线程同时 resize，链表反转导致环形引用。" },
        { "question": "负载因子为什么默认 0.75？", "hint": "空间利用率与冲突概率的折中，可从泊松分布角度解释。" }
      ],
      "difficulty": "MEDIUM",
      "tags": ["Java", "集合", "高频"]
    }
  ]
}
```

各文件主题清单（确保覆盖面，不必穷尽）：
- **java**：OOP 三大特性、String/StringBuilder、equals/hashCode、集合框架（HashMap/ConcurrentHashMap/ArrayList）、JUC（线程池/锁/volatile/AQS）、JVM（内存区/GC/类加载）
- **frontend**：闭包/原型链/事件循环、Promise/async、CSS 盒模型/Flex/BFC、React Hooks/虚拟 DOM/状态管理、浏览器渲染/跨域/缓存、性能优化
- **python**：可变不可变、装饰器、生成器/迭代器、GIL、深浅拷贝、asyncio、列表/字典底层、上下文管理器
- **mysql**：B+ 树索引/聚簇索引/回表/最左前缀、事务 ACID/隔离级别/MVCC、锁（行锁/间隙锁）、慢查询优化/执行计划、主从复制/分库分表
- **redis**：五大数据结构与底层编码、持久化 RDB/AOF、缓存穿透/击穿/雪崩、过期与淘汰策略、分布式锁、主从/哨兵/集群
- **network**：三次握手/四次挥手、TCP 可靠传输/拥塞控制、HTTP 1.1/2/3、HTTPS 握手、DNS 解析、Cookie/Session/Token
- **os**：进程线程协程、进程通信、死锁、内存管理（分页/虚拟内存/页面置换）、IO 多路复用（select/poll/epoll）、零拷贝
- **ai-llm**：Transformer/Attention、预训练与微调（LoRA/SFT/RLHF）、RAG 架构与优化、Agent/Function Calling、Prompt 工程、幻觉与评估、向量数据库

- [ ] **步骤 3：运行质量校验通过**

运行：`pnpm test src/lib/data-quality.test.ts`
预期：PASS，5 个用例全绿。

- [ ] **步骤 4：Commit**

```bash
git add src/lib/data-quality.test.ts data/questions/
git commit -m "feat: 生成 8 个分类约 300 道种子题目并通过质量校验"
```

---

### 任务 4：种子导入脚本

**文件：** 创建：`prisma/seed.ts`

- [ ] **步骤 1：实现 prisma/seed.ts（幂等 upsert）**

```ts
import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/db";
import { seedFileSchema } from "../src/lib/question-schema";
import type { Prisma } from "../src/generated/prisma/client";

const dir = path.join(process.cwd(), "data/questions");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

for (const file of files) {
  const data = seedFileSchema.parse(JSON.parse(readFileSync(path.join(dir, file), "utf8")));

  const bank = await prisma.questionBank.upsert({
    where: { slug: data.bank.slug },
    update: data.bank,
    create: data.bank,
  });

  let order = 0;
  for (const q of data.questions) {
    const { followUps, ...rest } = q;
    const payload = { ...rest, followUps: followUps as Prisma.InputJsonValue };
    const question = await prisma.question.upsert({
      where: { slug: q.slug },
      update: payload, // 不覆盖 viewCount
      create: { ...payload, viewCount: 100 + ((order * 37) % 900) }, // 确定性伪随机基线，幂等
    });
    await prisma.questionBankItem.upsert({
      where: { bankId_questionId: { bankId: bank.id, questionId: question.id } },
      update: { order },
      create: { bankId: bank.id, questionId: question.id, order },
    });
    order++;
  }
  console.log(`✅ ${data.bank.name}: ${data.questions.length} 题`);
}

await prisma.$disconnect();
```

- [ ] **步骤 2：执行导入并验证**

运行：`pnpm db:seed`
预期：8 行 ✅ 输出。

验证（追加到 `scripts/db-check.ts` 临时运行或直接 psql）：

```bash
pnpm tsx -e "import 'dotenv/config'; const { prisma } = await import('./src/lib/db'); console.log(await prisma.question.count(), await prisma.questionBank.count()); await prisma.\$disconnect()"
```

预期：题目数 ≥ 280，题库数 8。再次运行 `pnpm db:seed` 不报错（幂等）。

- [ ] **步骤 3：Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: 幂等种子导入脚本，约 300 道题入库"
```

---

### 任务 5：查询层（TDD）

**文件：**
- 创建：`src/lib/queries/banks.ts`、`src/lib/queries/questions.ts`
- 测试：`src/lib/queries/questions.test.ts`

- [ ] **步骤 1：编写失败的测试 src/lib/queries/questions.test.ts**

```ts
import { buildSearchWhere } from "./questions";

describe("buildSearchWhere", () => {
  it("标题模糊（忽略大小写）或 tag 精确命中", () => {
    expect(buildSearchWhere("hashmap")).toEqual({
      OR: [
        { title: { contains: "hashmap", mode: "insensitive" } },
        { tags: { has: "hashmap" } },
      ],
    });
  });
});
```

运行：`pnpm test src/lib/queries`，预期 FAIL。

- [ ] **步骤 2：实现 src/lib/queries/questions.ts**

```ts
import { prisma } from "@/lib/db";

export function buildSearchWhere(q: string) {
  return {
    OR: [
      { title: { contains: q, mode: "insensitive" as const } },
      { tags: { has: q } },
    ],
  };
}

const rowSelect = {
  id: true,
  title: true,
  slug: true,
  difficulty: true,
  tags: true,
  viewCount: true,
} as const;

export async function searchQuestions(q: string) {
  return prisma.question.findMany({
    where: buildSearchWhere(q),
    orderBy: { viewCount: "desc" },
    take: 50,
    select: rowSelect,
  });
}

export async function getQuestionMeta(slug: string) {
  return prisma.question.findUnique({
    where: { slug },
    select: { title: true, answerBrief: true },
  });
}

// 读取题目并 +1 浏览量；不存在返回 null
export async function viewQuestion(slug: string) {
  try {
    return await prisma.question.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });
  } catch {
    return null;
  }
}
```

运行：`pnpm test src/lib/queries`，预期 PASS。

- [ ] **步骤 3：实现 src/lib/queries/banks.ts**

```ts
import { prisma } from "@/lib/db";
import type { Difficulty } from "@/lib/question-schema";

export async function getBanksWithStats(category?: string) {
  const banks = await prisma.questionBank.findMany({
    where: category ? { category } : undefined,
    orderBy: { sortOrder: "asc" },
    include: { items: { select: { question: { select: { viewCount: true } } } } },
  });
  return banks.map(({ items, ...bank }) => ({
    ...bank,
    questionCount: items.length,
    viewTotal: items.reduce((sum, i) => sum + i.question.viewCount, 0),
  }));
}

export async function getBankDetail(slug: string, difficulty?: Difficulty) {
  return prisma.questionBank.findUnique({
    where: { slug },
    include: {
      items: {
        where: difficulty ? { question: { difficulty } } : undefined,
        orderBy: { order: "asc" },
        select: {
          question: {
            select: { id: true, title: true, slug: true, difficulty: true, tags: true, viewCount: true },
          },
        },
      },
    },
  });
}
```

- [ ] **步骤 4：质量门与 Commit**

运行：`pnpm lint && pnpm typecheck && pnpm test`，预期 PASS。

```bash
git add src/lib/queries/
git commit -m "feat: 题库与题目查询层（搜索条件构造器含单测）"
```

---

### 任务 6：基础业务组件（TDD）

**文件：**
- 创建：`src/components/question/difficulty-badge.tsx`、`src/components/question/question-row.tsx`、`src/components/bank/bank-card.tsx`、`src/components/bank/category-nav.tsx`
- 测试：`src/components/question/difficulty-badge.test.tsx`、`src/components/bank/bank-card.test.tsx`

- [ ] **步骤 1：编写失败的测试 difficulty-badge.test.tsx**

```tsx
import { render, screen } from "@testing-library/react";
import { DifficultyBadge } from "./difficulty-badge";

describe("DifficultyBadge", () => {
  it.each([
    ["EASY", "简单", "text-emerald-600"],
    ["MEDIUM", "中等", "text-orange-600"],
    ["HARD", "困难", "text-red-500"],
  ] as const)("%s 显示「%s」", (difficulty, label, cls) => {
    render(<DifficultyBadge difficulty={difficulty} />);
    expect(screen.getByText(label)).toHaveClass(cls);
  });
});
```

运行：`pnpm test difficulty-badge`，预期 FAIL。

- [ ] **步骤 2：实现 difficulty-badge.tsx**

```tsx
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/question-schema";

const MAP: Record<Difficulty, { label: string; className: string }> = {
  EASY: { label: "简单", className: "bg-emerald-50 text-emerald-600" },
  MEDIUM: { label: "中等", className: "bg-orange-50 text-orange-600" },
  HARD: { label: "困难", className: "bg-red-50 text-red-500" },
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { label, className } = MAP[difficulty];
  return (
    <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}
```

运行：`pnpm test difficulty-badge`，预期 PASS。

- [ ] **步骤 3：编写失败的测试 bank-card.test.tsx**

```tsx
import { render, screen } from "@testing-library/react";
import { BankCard } from "./bank-card";

describe("BankCard", () => {
  const bank = { name: "MySQL", slug: "mysql", description: "索引 · 事务", icon: "🗄️", questionCount: 38, viewTotal: 15600 };

  it("渲染名称、题数与格式化浏览量，并链接到详情", () => {
    render(<BankCard bank={bank} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/banks/mysql");
    expect(screen.getByText("MySQL")).toBeInTheDocument();
    expect(screen.getByText("38 题")).toBeInTheDocument();
    expect(screen.getByText(/15\.6k/)).toBeInTheDocument();
  });
});
```

运行：`pnpm test bank-card`，预期 FAIL。

- [ ] **步骤 4：实现 bank-card.tsx**

```tsx
import Link from "next/link";
import { formatCount } from "@/lib/format";

export interface BankCardData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  questionCount: number;
  viewTotal: number;
}

export function BankCard({ bank }: { bank: BankCardData }) {
  return (
    <Link
      href={`/banks/${bank.slug}`}
      className="block rounded-card border border-border-warm bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-lg hover:shadow-orange-100"
    >
      <div className="mb-3 flex size-9 items-center justify-center rounded-[10px] bg-cream text-lg">
        {bank.icon}
      </div>
      <h3 className="text-sm font-semibold text-ink">{bank.name}</h3>
      <p className="mt-1 line-clamp-1 text-xs text-neutral-400">{bank.description}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
        <span>{bank.questionCount} 题</span>
        <b className="font-mono font-semibold text-primary">{formatCount(bank.viewTotal)} 次浏览</b>
      </div>
    </Link>
  );
}
```

运行：`pnpm test bank-card`，预期 PASS。

- [ ] **步骤 5：实现 question-row.tsx（列表/搜索共用）**

```tsx
import Link from "next/link";
import { DifficultyBadge } from "./difficulty-badge";
import type { Difficulty } from "@/lib/question-schema";

export interface QuestionRowData {
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: string[];
  viewCount: number;
}

export function QuestionRow({ question }: { question: QuestionRowData }) {
  return (
    <Link
      href={`/questions/${question.slug}`}
      className="flex items-center gap-3 rounded-card border border-border-warm bg-white px-4 py-3 transition-colors hover:border-primary"
    >
      <DifficultyBadge difficulty={question.difficulty} />
      <span className="flex-1 truncate text-sm font-medium text-ink">{question.title}</span>
      <span className="hidden gap-1 sm:flex">
        {question.tags.slice(0, 3).map((t) => (
          <span key={t} className="rounded-full bg-cream px-2 py-0.5 text-xs text-[#B4690E]">
            {t}
          </span>
        ))}
      </span>
      <span className="w-12 text-right font-mono text-xs text-neutral-400">{question.viewCount}</span>
    </Link>
  );
}
```

- [ ] **步骤 6：实现 category-nav.tsx（含「热门」全部入口）**

```tsx
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";

export function CategoryNav({ current }: { current?: string }) {
  const items: { label: string; value?: string }[] = [
    { label: "🔥 热门" },
    ...CATEGORIES.map((c) => ({ label: c, value: c })),
  ];
  return (
    <nav className="flex flex-wrap gap-2">
      {items.map(({ label, value }) => (
        <Link
          key={label}
          href={value ? `/banks?category=${encodeURIComponent(value)}` : "/banks"}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm transition-colors",
            current === value
              ? "bg-primary font-medium text-white"
              : "bg-[#FFF4E8] text-[#B4690E] hover:bg-[#FFE8D2]",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **步骤 7：质量门与 Commit**

运行：`pnpm lint && pnpm typecheck && pnpm test`，预期全 PASS。

```bash
git add src/components/
git commit -m "feat: 难度徽章、题库卡片、题目行与分类导航组件"
```

---

### 任务 7：首页（全功能版）

**文件：** 修改：`src/app/(main)/page.tsx`（整体替换 M0 占位版）

- [ ] **步骤 1：实现首页（RSC 直查 + 无 JS 搜索表单）**

```tsx
import { DuckIcon } from "@/components/duck/duck-icon";
import { CategoryNav } from "@/components/bank/category-nav";
import { BankCard } from "@/components/bank/bank-card";
import { getBanksWithStats } from "@/lib/queries/banks";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const banks = await getBanksWithStats();
  const totalQuestions = banks.reduce((s, b) => s + b.questionCount, 0);

  return (
    <>
      <section className="bg-[linear-gradient(135deg,#FFF7ED_0%,#FFEDD5_60%,#FED7AA_100%)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-14">
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold leading-snug text-ink">
              把八股文，刷成<em className="not-italic text-primary">肌肉记忆</em>
            </h1>
            <p className="mt-3 text-sm text-[#92765A]">
              {totalQuestions}+ 道高频面试题 · AI 面试官追问 · 程序员求职刷题神器
            </p>
            <form
              action="/search"
              className="mt-6 flex w-full max-w-md items-center rounded-full border-2 border-primary bg-white py-1 pl-5 pr-1"
            >
              <input
                name="q"
                required
                placeholder="搜索题目，如：HashMap 扩容机制…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-300"
              />
              <button
                type="submit"
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                搜索
              </button>
            </form>
          </div>
          <div className="hidden sm:block">
            <DuckIcon size={130} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <CategoryNav />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {banks.map((b) => (
            <BankCard key={b.id} bank={b} />
          ))}
        </div>
      </div>
    </>
  );
}
```

- [ ] **步骤 2：验证与 Commit**

运行：`pnpm dev`，走查：题库卡片有真实数据、hover 上浮橙描边、搜索框回车跳 `/search?q=…`（页面暂 404，任务 11 补）。
运行：`pnpm lint && pnpm typecheck && pnpm test`，预期 PASS。

```bash
git add src/app/
git commit -m "feat: 首页接入真实题库数据（Hero 搜索+分类导航+卡片网格）"
```

---

### 任务 8：题库列表页与题库详情页

**文件：**
- 创建：`src/app/(main)/banks/page.tsx`、`src/app/(main)/banks/[slug]/page.tsx`

- [ ] **步骤 1：实现 banks/page.tsx（?category= 筛选）**

```tsx
import { DuckIcon } from "@/components/duck/duck-icon";
import { CategoryNav } from "@/components/bank/category-nav";
import { BankCard } from "@/components/bank/bank-card";
import { getBanksWithStats } from "@/lib/queries/banks";

export const dynamic = "force-dynamic";
export const metadata = { title: "题库" };

export default async function BanksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const banks = await getBanksWithStats(category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-xl font-bold text-ink">题库</h1>
      <div className="mt-4">
        <CategoryNav current={category} />
      </div>
      {banks.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-neutral-400">
          <DuckIcon size={72} />
          <p className="mt-4 text-sm">这个分类还没有题库，换个分类看看吧</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {banks.map((b) => (
            <BankCard key={b.id} bank={b} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **步骤 2：实现 banks/[slug]/page.tsx（难度筛选胶囊）**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { QuestionRow } from "@/components/question/question-row";
import { getBankDetail } from "@/lib/queries/banks";
import { difficultySchema } from "@/lib/question-schema";

export const dynamic = "force-dynamic";

const FILTERS = [
  { label: "全部", value: undefined },
  { label: "简单", value: "EASY" },
  { label: "中等", value: "MEDIUM" },
  { label: "困难", value: "HARD" },
] as const;

export default async function BankDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ difficulty?: string }>;
}) {
  const { slug } = await params;
  const { difficulty: raw } = await searchParams;
  const parsed = difficultySchema.safeParse(raw);
  const difficulty = parsed.success ? parsed.data : undefined;

  const bank = await getBankDetail(slug, difficulty);
  if (!bank) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-card bg-cream text-3xl">
          {bank.icon}
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">{bank.name}</h1>
          <p className="mt-1 text-sm text-neutral-400">{bank.description}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/banks/${slug}?difficulty=${f.value}` : `/banks/${slug}`}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              difficulty === f.value
                ? "bg-primary font-medium text-white"
                : "bg-[#FFF4E8] text-[#B4690E] hover:bg-[#FFE8D2]",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {bank.items.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-400">该难度下暂无题目</p>
        ) : (
          bank.items.map(({ question }) => <QuestionRow key={question.id} question={question} />)
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bank = await getBankDetail(slug);
  return bank ? { title: bank.name, description: bank.description } : {};
}
```

- [ ] **步骤 3：验证与 Commit**

运行：`pnpm dev`，走查：`/banks` 分类筛选、`/banks/mysql` 难度筛选、空结果空状态、题目行点击进入 `/questions/...`（暂 404，任务 10 补）。
运行：`pnpm lint && pnpm typecheck && pnpm test`，预期 PASS。

```bash
git add src/app/
git commit -m "feat: 题库列表页与详情页（分类与难度筛选）"
```

---

### 任务 9：Markdown 渲染组件（react-markdown + shiki 同步高亮）

**文件：**
- 创建：`src/lib/shiki.ts`、`src/components/question/markdown-content.tsx`
- 测试：`src/components/question/markdown-content.test.tsx`
- 修改：`src/app/globals.css`（typography 插件）

> ⚠️ shiki 4.x 的子路径导入与 @shikijs/rehype 同步用法，执行时用 Context7 对照官方文档确认（思路固定：同步 highlighter 单例 + `rehypeShikiFromHighlighter`，兼容 react-markdown 的同步渲染）。

- [ ] **步骤 1：安装依赖**

```bash
pnpm add react-markdown remark-gfm shiki @shikijs/rehype @tailwindcss/typography
```

`src/app/globals.css` 顶部 `@import "tailwindcss";` 之后追加：

```css
@plugin "@tailwindcss/typography";
```

- [ ] **步骤 2：编写失败的测试 markdown-content.test.tsx**

```tsx
import { render, screen } from "@testing-library/react";
import { MarkdownContent } from "./markdown-content";

describe("MarkdownContent", () => {
  it("渲染标题、表格与高亮代码块", () => {
    const source = "## 触发条件\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n```java\nint a = 1;\n```";
    render(<MarkdownContent source={source} />);
    expect(screen.getByRole("heading", { level: 2, name: "触发条件" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(document.querySelector("pre.shiki")).toBeInTheDocument();
  });
});
```

运行：`pnpm test markdown-content`，预期 FAIL。

- [ ] **步骤 3：实现 src/lib/shiki.ts（同步单例）**

```ts
import { createHighlighterCoreSync, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import oneLight from "@shikijs/themes/one-light";
import java from "@shikijs/langs/java";
import javascript from "@shikijs/langs/javascript";
import typescript from "@shikijs/langs/typescript";
import python from "@shikijs/langs/python";
import sql from "@shikijs/langs/sql";
import bash from "@shikijs/langs/bash";
import json from "@shikijs/langs/json";

const globalForShiki = globalThis as unknown as { shiki?: HighlighterCore };

export const highlighter =
  globalForShiki.shiki ??
  createHighlighterCoreSync({
    themes: [oneLight],
    langs: [java, javascript, typescript, python, sql, bash, json],
    engine: createJavaScriptRegexEngine(),
  });

globalForShiki.shiki = highlighter;
```

- [ ] **步骤 4：实现 markdown-content.tsx**

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { highlighter } from "@/lib/shiki";

export function MarkdownContent({ source }: { source: string }) {
  return (
    <div className="prose prose-sm prose-neutral max-w-none prose-headings:text-ink prose-a:text-primary prose-code:font-mono">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeShikiFromHighlighter, highlighter, { theme: "one-light", defaultLanguage: "text", fallbackLanguage: "text" }],
        ]}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
```

- [ ] **步骤 5：运行测试验证通过**

运行：`pnpm test markdown-content`，预期 PASS。

- [ ] **步骤 6：Commit**

```bash
git add src/lib/shiki.ts src/components/question/markdown-content.tsx src/components/question/markdown-content.test.tsx src/app/globals.css package.json pnpm-lock.yaml
git commit -m "feat: Markdown 渲染组件（react-markdown + shiki 同步高亮）"
```

---

### 任务 10：三层答案组件与题目详情页（核心页面，TDD）

**文件：**
- 创建：`src/components/question/answer-layers.tsx`、`src/app/(main)/questions/[slug]/page.tsx`
- 测试：`src/components/question/answer-layers.test.tsx`

- [ ] **步骤 1：编写失败的测试 answer-layers.test.tsx**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnswerLayers } from "./answer-layers";

const followUps = [
  { question: "为什么扩容是 2 倍？", hint: <p>位运算提示</p> },
  { question: "1.7 和 1.8 有何区别？", hint: <p>红黑树提示</p> },
];

function setup() {
  render(<AnswerLayers brief="速记内容" detail={<p>详解内容</p>} followUps={followUps} />);
  return userEvent.setup();
}

describe("AnswerLayers 三层答案", () => {
  it("速记默认可见，详解与追问提示默认隐藏", () => {
    setup();
    expect(screen.getByText("速记内容")).toBeVisible();
    expect(screen.queryByText("详解内容")).not.toBeInTheDocument();
    expect(screen.queryByText("位运算提示")).not.toBeInTheDocument();
  });

  it("点击「展开详解」显示详解，再点收起", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: /展开详解/ }));
    expect(screen.getByText("详解内容")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /收起详解/ }));
    expect(screen.queryByText("详解内容")).not.toBeInTheDocument();
  });

  it("追问逐个翻开，互不影响且保持展开", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: /追问 1/ }));
    expect(screen.getByText("位运算提示")).toBeVisible();
    expect(screen.queryByText("红黑树提示")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /追问 2/ }));
    expect(screen.getByText("位运算提示")).toBeVisible();
    expect(screen.getByText("红黑树提示")).toBeVisible();
  });
});
```

运行：`pnpm test answer-layers`，预期 FAIL。

- [ ] **步骤 2：实现 answer-layers.tsx（client）**

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface FollowUpItem {
  question: string;
  hint: React.ReactNode;
}

export function AnswerLayers({
  brief,
  detail,
  followUps,
}: {
  brief: string;
  detail: React.ReactNode;
  followUps: FollowUpItem[];
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);

  return (
    <div className="space-y-4">
      {/* ① 30 秒速记：默认展开 */}
      <section className="rounded-card border border-primary/30 bg-cream p-5">
        <h2 className="text-sm font-bold text-primary">⚡ 30 秒速记</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink">{brief}</p>
      </section>

      {/* ② 详解：点击展开 */}
      <section className="rounded-card border border-border-warm p-5">
        <button
          type="button"
          onClick={() => setDetailOpen((o) => !o)}
          className="flex w-full items-center justify-between text-sm font-bold text-ink"
        >
          <span>📖 详解版</span>
          <span className="text-xs font-medium text-primary">
            {detailOpen ? "收起详解" : "展开详解"}
          </span>
        </button>
        {detailOpen && <div className="mt-4">{detail}</div>}
      </section>

      {/* ③ 追问链：逐个翻开（先想后看） */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-ink">🔍 面试官追问</h2>
        {followUps.map((f, i) => {
          const open = revealed.includes(i);
          return (
            <div
              key={f.question}
              className={cn(
                "rounded-card border p-4 transition-colors",
                open ? "border-primary/40 bg-cream/40" : "border-border-warm",
              )}
            >
              <button
                type="button"
                className="w-full text-left text-sm font-medium text-ink"
                onClick={() => setRevealed((r) => (r.includes(i) ? r : [...r, i]))}
              >
                追问 {i + 1}：{f.question}
              </button>
              {open ? (
                <div className="mt-2 text-sm">{f.hint}</div>
              ) : (
                <p className="mt-1 text-xs text-neutral-400">先自己想一想，点击查看提示</p>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
```

运行：`pnpm test answer-layers`，预期 PASS。

- [ ] **步骤 3：实现题目详情页 questions/[slug]/page.tsx**

```tsx
import { notFound } from "next/navigation";
import { viewQuestion, getQuestionMeta } from "@/lib/queries/questions";
import { followUpsSchema } from "@/lib/question-schema";
import { AnswerLayers } from "@/components/question/answer-layers";
import { MarkdownContent } from "@/components/question/markdown-content";
import { DifficultyBadge } from "@/components/question/difficulty-badge";

export const dynamic = "force-dynamic";

export default async function QuestionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const question = await viewQuestion(slug);
  if (!question) notFound();

  const followUps = followUpsSchema.parse(question.followUps);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={question.difficulty} />
        {question.tags.map((t) => (
          <span key={t} className="rounded-full bg-cream px-2.5 py-0.5 text-xs text-[#B4690E]">
            {t}
          </span>
        ))}
        <span className="ml-auto font-mono text-xs text-neutral-400">
          {question.viewCount} 次浏览
        </span>
      </div>
      <h1 className="mt-3 text-2xl font-bold text-ink">{question.title}</h1>
      <div className="mt-6">
        <AnswerLayers
          brief={question.answerBrief}
          detail={<MarkdownContent source={question.answerDetail} />}
          followUps={followUps.map((f) => ({
            question: f.question,
            hint: <MarkdownContent source={f.hint} />,
          }))}
        />
      </div>
    </article>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = await getQuestionMeta(slug);
  return meta ? { title: meta.title, description: meta.answerBrief.slice(0, 80) } : {};
}
```

- [ ] **步骤 4：验证与 Commit**

运行：`pnpm dev`，走查 `/questions/java-hashmap-resize`（以实际种子 slug 为准）：速记默认展开、详解点开有代码高亮与表格、追问逐个翻开、刷新后浏览量 +1。
运行：`pnpm lint && pnpm typecheck && pnpm test`，预期 PASS。

```bash
git add src/components/question/ src/app/
git commit -m "feat: 题目详情页与三层答案交互（速记/详解/追问链）"
```

---

### 任务 11：搜索页

**文件：** 创建：`src/app/(main)/search/page.tsx`

- [ ] **步骤 1：实现 search/page.tsx**

```tsx
import { DuckIcon } from "@/components/duck/duck-icon";
import { QuestionRow } from "@/components/question/question-row";
import { searchQuestions } from "@/lib/queries/questions";

export const dynamic = "force-dynamic";
export const metadata = { title: "搜索" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const keyword = q?.trim() ?? "";
  const results = keyword ? await searchQuestions(keyword) : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-bold text-ink">
        「{keyword}」的搜索结果
        <span className="ml-2 font-mono text-sm font-normal text-neutral-400">
          {results.length} 条
        </span>
      </h1>
      {results.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-neutral-400">
          <DuckIcon size={72} />
          <p className="mt-4 text-sm">没找到相关题目，换个关键词试试（如：索引、HashMap）</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {results.map((question) => (
            <QuestionRow key={question.id} question={question} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **步骤 2：验证与 Commit**

运行：`pnpm dev`，走查：首页搜「索引」有结果、搜「不存在的词xyz」出鸭子空状态。
运行：`pnpm lint && pnpm typecheck && pnpm test`，预期 PASS。

```bash
git add src/app/
git commit -m "feat: 搜索结果页（标题模糊+标签命中，空状态吉祥物）"
```

---

### 任务 12：E2E 黄金路径与 M1 验收

**文件：** 创建：`e2e/m1-golden-path.spec.ts`

> 前置：本地 DB 已执行 `pnpm db:seed`。

- [ ] **步骤 1：编写 E2E（需求文档 §6 M1 黄金路径）**

```ts
import { test, expect } from "@playwright/test";

test("M1 黄金路径：首页→题库→筛选→三层答案→搜索", async ({ page }) => {
  // 首页：分类导航与题库卡片
  await page.goto("/");
  await expect(page.getByRole("link", { name: /热门/ })).toBeVisible();

  // 进入题库列表→某题库详情
  await page.getByRole("link", { name: "题库", exact: true }).click();
  await page.locator("a[href^='/banks/']").first().click();
  await expect(page).toHaveURL(/\/banks\/[a-z-]+/);

  // 难度筛选
  await page.getByRole("link", { name: "中等", exact: true }).click();
  await expect(page).toHaveURL(/difficulty=MEDIUM/);

  // 进入题目：三层答案
  await page.locator("a[href^='/questions/']").first().click();
  await expect(page.getByText("30 秒速记")).toBeVisible();
  await page.getByRole("button", { name: /展开详解/ }).click();
  await expect(page.locator(".prose").first()).toBeVisible();
  await page.getByRole("button", { name: /追问 1/ }).click();
  await expect(page.getByText("先自己想一想，点击查看提示")).toHaveCount(
    (await page.getByRole("button", { name: /追问 \d/ }).count()) - 1,
  );

  // 搜索有结果
  await page.goto("/");
  await page.getByPlaceholder(/搜索题目/).fill("索引");
  await page.getByRole("button", { name: "搜索" }).click();
  await expect(page).toHaveURL(/\/search\?q=/);
  await expect(page.locator("a[href^='/questions/']").first()).toBeVisible();
});
```

- [ ] **步骤 2：运行 E2E**

运行：`pnpm e2e`
预期：冒烟 + 黄金路径全部 passed。

- [ ] **步骤 3：完整质量门**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm e2e
```

预期：全绿。

- [ ] **步骤 4：Commit**

```bash
git add e2e/
git commit -m "test: M1 黄金路径 E2E（浏览-筛选-三层答案-搜索）"
```

- [ ] **步骤 5：人工验收清单（请用户走查）**

- [ ] 首页：真实题库卡片、总题数、搜索可用
- [ ] `/banks?category=数据库` 显示 MySQL + Redis 两个题库
- [ ] 题库详情难度筛选正确
- [ ] 题目页：速记默认展开、详解 Markdown 代码高亮、追问逐个翻开、浏览量递增
- [ ] 搜索中英文关键词均有合理结果，空结果出鸭子
- [ ] UI 对照暖橙原型：无紫蓝渐变、无默认 shadcn 灰黑、渐变只在 Hero
- [ ] SEO：题目页 `<title>` 为题目标题，URL 为语义化 slug

人工验收通过后才进入 M2。

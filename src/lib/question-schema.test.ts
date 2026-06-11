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

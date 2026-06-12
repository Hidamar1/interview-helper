import { describe, it, expect } from "vitest";
import { reportSchema } from "./report";

const validReport = {
  overallScore: 78,
  dimensions: { knowledge: 80, depth: 72, expression: 75, logic: 78, adaptability: 85 },
  strengths: ["基础知识扎实", "应变能力强"],
  weaknesses: [
    {
      point: "HashMap 扩容机制理解不深入",
      questionId: "java-hashmap-resize",
      suggestion: "阅读 JDK 源码 resize() 方法",
    },
  ],
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
    const rest = { ...validReport };
    delete (rest as Record<string, unknown>).dimensions;
    expect(reportSchema.safeParse(rest).success).toBe(false);
  });

  it("可选 questionId 缺失也应通过", () => {
    const report = {
      ...validReport,
      weaknesses: [{ point: "test", suggestion: "test" }],
    };
    expect(reportSchema.safeParse(report).success).toBe(true);
  });
});

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
  weaknesses: z.array(
    z.object({
      point: z.string().describe("薄弱点描述"),
      questionId: z.string().optional().describe("关联的题库题目 ID，方便回链复习"),
      suggestion: z.string().describe("改进建议"),
    }),
  ).describe("薄弱点（2-5 条，每条关联对应题目）"),
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

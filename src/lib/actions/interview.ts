"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { Difficulty } from "@/lib/question-schema";
import type { InterviewReport } from "@/lib/prompts/report";
import { reportSchema, buildReportPrompt } from "@/lib/prompts/report";
import { getModel } from "@/lib/ai";
import { generateObject } from "ai";

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      report: report as any,
    },
  });
  revalidatePath(`/interview/${sessionId}/report`);
}

/** 由 DeepSeek 生成评分报告并持久化 */
export async function generateReport(sessionId: string): Promise<InterviewReport> {
  const sess = await auth.api.getSession({ headers: await headers() });
  if (!sess) throw new Error("请先登录");

  const interview = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    include: {
      bank: { select: { name: true } },
      messages: { orderBy: { order: "asc" } },
    },
  });
  if (!interview || interview.userId !== sess.user.id) throw new Error("无权操作");
  if (interview.status !== "FINISHED") throw new Error("面试尚未结束");

  // 如果已有报告，直接返回缓存的
  if (interview.report) {
    return reportSchema.parse(interview.report);
  }

  // 构造对话记录
  const transcript = interview.messages
    .filter((m) => m.role !== "SYSTEM")
    .map((m) => `[${m.role === "INTERVIEWER" ? "面试官" : "候选人"}]: ${m.content}`)
    .join("\n\n");

  const prompt = `${buildReportPrompt(interview.bank.name)}\n\n## 对话记录\n${transcript}`;

  const model = getModel();
  if (!model) {
    // mock 模式：返回假数据
    const mockReport: InterviewReport = {
      overallScore: 75,
      dimensions: { knowledge: 72, depth: 68, expression: 80, logic: 75, adaptability: 78 },
      strengths: ["回答问题态度积极", "思路清晰"],
      weaknesses: [
        { point: "某些细节回答不够准确", suggestion: "建议复习相关基础知识" },
        { point: "深度有待加强", suggestion: "多阅读源码和原理分析" },
      ],
      summary: "整体表现良好，基础知识扎实但深度需要加强。建议针对薄弱点进行系统性复习。",
    };
    await finishSession(sessionId, mockReport);
    return mockReport;
  }

  const { object } = await generateObject({
    model,
    schema: reportSchema,
    prompt,
  });

  await finishSession(sessionId, object);
  return object;
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

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

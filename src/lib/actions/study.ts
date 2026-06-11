"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

/** 记录用户浏览某题（按天去重），如果当天已有记录则忽略 */
export async function recordStudy(questionId: string): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return; // 未登录静默跳过

  const userId = session.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 使用 upsert 天然去重（@@unique([userId, questionId, date])）
  await prisma.studyRecord.upsert({
    where: {
      userId_questionId_date: { userId, questionId, date: today },
    },
    update: {}, // 已存在则无操作
    create: { userId, questionId, date: today },
  });
}

/** 热力图数据：最近 365 天每天的刷题次数 */
export async function getHeatmapData(): Promise<{ date: string; count: number }[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return [];

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 365);

  const records = await prisma.studyRecord.groupBy({
    by: ["date"],
    where: {
      userId: session.user.id,
      date: { gte: startDate, lte: endDate },
    },
    _count: { id: true },
    orderBy: { date: "asc" },
  });

  return records.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    count: r._count.id,
  }));
}

/** 获取用户刷题总数 */
export async function getStudyCount(): Promise<number> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return 0;

  return prisma.studyRecord.count({
    where: { userId: session.user.id },
  });
}

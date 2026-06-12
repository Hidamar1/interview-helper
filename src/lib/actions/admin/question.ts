"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

const adminQuestionSchema = z.object({
  title: z.string().min(5),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug 须为小写英文连字符"),
  answerBrief: z.string().min(20).max(300),
  answerDetail: z.string().min(200),
  followUps: z
    .array(
      z.object({
        question: z.string().min(5),
        hint: z.string().min(10),
      }),
    )
    .min(2)
    .max(4),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  tags: z.array(z.string().min(1)).min(1).max(6),
  bankId: z.string(),
});

async function checkAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    throw new Error("无权访问");
  }
  return session;
}

export async function createQuestion(data: z.infer<typeof adminQuestionSchema>) {
  await checkAdmin();
  const parsed = adminQuestionSchema.parse(data);
  const { bankId, ...questionData } = parsed;

  const existing = await prisma.question.findUnique({
    where: { slug: questionData.slug },
  });
  if (existing) throw new Error("slug 已被占用");

  const question = await prisma.question.create({
    data: {
      ...questionData,
      followUps: questionData.followUps as Prisma.InputJsonValue,
      viewCount: 0,
    },
  });

  await prisma.questionBankItem.create({
    data: { bankId, questionId: question.id, order: 0 },
  });

  revalidatePath("/admin/questions");
}

export async function updateQuestion(
  id: string,
  data: z.infer<typeof adminQuestionSchema>,
) {
  await checkAdmin();
  const parsed = adminQuestionSchema.parse(data);
  const { bankId: _bankId, ...questionData } = parsed;
  void _bankId; // 编辑时不修改题库归属

  const existing = await prisma.question.findUnique({
    where: { slug: questionData.slug },
  });
  if (existing && existing.id !== id) throw new Error("slug 已被占用");

  await prisma.question.update({
    where: { id },
    data: {
      ...questionData,
      followUps: questionData.followUps as Prisma.InputJsonValue,
    },
  });

  revalidatePath("/admin/questions");
}

export async function deleteQuestion(id: string) {
  await checkAdmin();
  await prisma.question.delete({ where: { id } });
  revalidatePath("/admin/questions");
}

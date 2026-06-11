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

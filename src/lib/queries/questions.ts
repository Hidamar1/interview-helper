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

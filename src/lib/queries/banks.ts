import { prisma } from "@/lib/db";
import type { Difficulty } from "@/lib/question-schema";

export async function getBanksWithStats(category?: string) {
  // 单条 SQL JOIN 替代 N+1，减少 Neon 往返次数
  const whereClause = category ? `WHERE b.category = '${category.replace(/'/g, "''")}'` : "";
  const banks = await prisma.$queryRawUnsafe<
    { id: string; name: string; slug: string; description: string; icon: string; category: string; sortOrder: number; createdAt: Date; updatedAt: Date; questionCount: bigint; viewTotal: bigint | null }[]
  >(`
    SELECT
      b.*,
      COUNT(bi."questionId")::int8 AS "questionCount",
      COALESCE(SUM(q."viewCount"), 0)::int8 AS "viewTotal"
    FROM "QuestionBank" b
    LEFT JOIN "QuestionBankItem" bi ON bi."bankId" = b.id
    LEFT JOIN "Question" q ON q.id = bi."questionId"
    ${whereClause}
    GROUP BY b.id
    ORDER BY b."sortOrder" ASC
  `);
  return banks.map((b) => ({
    ...b,
    questionCount: Number(b.questionCount),
    viewTotal: Number(b.viewTotal),
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

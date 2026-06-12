import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { QuestionTable } from "@/components/admin/question-form";

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/");
  }

  const questions = await prisma.question.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      banks: {
        select: { bank: { select: { id: true, name: true } } },
      },
    },
  });

  const banks = await prisma.questionBank.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <QuestionTable
      questions={questions.map((q) => ({
        id: q.id,
        title: q.title,
        slug: q.slug,
        difficulty: q.difficulty as "EASY" | "MEDIUM" | "HARD",
        tags: q.tags,
        viewCount: q.viewCount,
        bankId: q.banks[0]?.bank.id ?? "",
        bankName: q.banks[0]?.bank.name ?? "—",
        answerBrief: q.answerBrief,
        answerDetail: q.answerDetail,
        followUps: q.followUps as { question: string; hint: string }[],
      }))}
      banks={banks}
    />
  );
}

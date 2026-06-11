import { notFound } from "next/navigation";
import { viewQuestion, getQuestionMeta } from "@/lib/queries/questions";
import { followUpsSchema } from "@/lib/question-schema";
import { AnswerLayers } from "@/components/question/answer-layers";
import { MarkdownContent } from "@/components/question/markdown-content";
import { DifficultyBadge } from "@/components/question/difficulty-badge";

export const dynamic = "force-dynamic";

export default async function QuestionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const question = await viewQuestion(slug);
  if (!question) notFound();

  const followUps = followUpsSchema.parse(question.followUps);

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={question.difficulty} />
        {question.tags.map((t) => (
          <span key={t} className="rounded-full bg-cream px-2.5 py-0.5 text-xs text-[#B4690E]">
            {t}
          </span>
        ))}
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {question.viewCount} 次浏览
        </span>
      </div>
      <h1 className="mt-3 text-2xl font-bold text-ink">{question.title}</h1>
      <div className="mt-6">
        <AnswerLayers
          brief={question.answerBrief}
          detail={<MarkdownContent source={question.answerDetail} />}
          followUps={followUps.map((f) => ({
            question: f.question,
            hint: <MarkdownContent source={f.hint} />,
          }))}
        />
      </div>
    </article>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = await getQuestionMeta(slug);
  return meta ? { title: meta.title, description: meta.answerBrief.slice(0, 80) } : {};
}

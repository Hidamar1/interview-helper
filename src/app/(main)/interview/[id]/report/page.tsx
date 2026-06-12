import Link from "next/link";
import { notFound } from "next/navigation";
import { getInterviewDetail } from "@/lib/actions/interview";
import { RadarChart } from "@/components/interview/radar-chart";
import { ScoreCard } from "@/components/interview/score-card";
import { WeaknessList } from "@/components/interview/weakness-list";
import { reportSchema } from "@/lib/prompts/report";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const interview = await getInterviewDetail(id);
  if (!interview || interview.status !== "FINISHED") notFound();

  const report = interview.report ? reportSchema.parse(interview.report) : null;
  if (!report) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">报告生成中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <h1 className="text-center text-xl font-bold text-ink">
        {interview.bank.name} 模拟面试报告
      </h1>

      <section className="rounded-xl border border-border-warm bg-white p-6">
        <ScoreCard report={report} />
      </section>

      <section className="rounded-xl border border-border-warm bg-white p-6">
        <h2 className="mb-4 text-lg font-bold text-ink">能力雷达图</h2>
        <RadarChart data={report.dimensions} />
      </section>

      <section className="rounded-xl border border-border-warm bg-white p-6">
        <h2 className="mb-2 text-lg font-bold text-ink">优势</h2>
        <ul className="list-inside list-disc space-y-1">
          {report.strengths.map((s, i) => (
            <li key={i} className="text-sm text-ink">
              {s}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border-warm bg-white p-6">
        <h2 className="mb-3 text-lg font-bold text-ink">需要提升</h2>
        <WeaknessList weaknesses={report.weaknesses} />
      </section>

      <section className="rounded-xl border border-border-warm bg-white p-6">
        <h2 className="mb-2 text-lg font-bold text-ink">总评</h2>
        <p className="text-sm leading-relaxed text-ink">{report.summary}</p>
      </section>

      <div className="flex justify-center gap-3">
        <Link
          href="/interview"
          className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white"
        >
          再面一次
        </Link>
        <Link
          href={`/interview/${id}`}
          className="rounded-full border border-border-warm px-6 py-2 text-sm text-ink"
        >
          回看对话
        </Link>
      </div>
    </div>
  );
}

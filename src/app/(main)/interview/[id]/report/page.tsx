import Link from "next/link";
import { notFound } from "next/navigation";
import { getInterviewDetail, generateReport } from "@/lib/actions/interview";
import { reportSchema } from "@/lib/prompts/report";
import { RadarChart } from "@/components/interview/radar-chart";
import { ScoreCard } from "@/components/interview/score-card";
import { WeaknessList } from "@/components/interview/weakness-list";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const interview = await getInterviewDetail(id);
  if (!interview || interview.status !== "FINISHED") notFound();

  // 如果还没有报告，调用 DeepSeek 生成
  if (!interview.report) {
    try {
      await generateReport(id);
    } catch {
      return (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-muted-foreground">报告生成失败，请刷新重试</p>
        </div>
      );
    }
  }

  // 重新获取（包含刚生成的报告）
  const updated = await getInterviewDetail(id);
  if (!updated?.report) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">报告生成中...</p>
      </div>
    );
  }

  const parsed = reportSchema.safeParse(updated.report);
  if (!parsed.success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">报告数据异常</p>
        <a href={`/interview/${id}`} className="mt-4 inline-block rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white">
          回看对话
        </a>
      </div>
    );
  }
  const report = parsed.data;

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

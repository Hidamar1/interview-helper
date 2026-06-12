import Link from "next/link";
import { getInterviewHistory } from "@/lib/actions/interview";
import { DifficultyBadge } from "@/components/question/difficulty-badge";

export const dynamic = "force-dynamic";

export default async function InterviewHistoryPage() {
  const history = await getInterviewHistory();

  if (history.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="text-4xl">{"🦆"}</div>
        <h1 className="mt-4 text-lg font-bold text-ink">还没有面试记录</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          完成一次 AI 模拟面试后，记录会出现在这里
        </p>
        <Link
          href="/interview"
          className="mt-6 inline-block rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white"
        >
          开始面试
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-bold text-ink">面试历史</h1>
      <ul className="mt-4 space-y-3">
        {history.map((h) => {
          const report = h.report as { overallScore?: number } | null;
          return (
            <li key={h.id}>
              <Link
                href={
                  h.status === "FINISHED"
                    ? `/interview/${h.id}/report`
                    : `/interview/${h.id}`
                }
                className="flex items-center gap-4 rounded-card border border-border-warm bg-white p-4 transition-colors hover:border-primary"
              >
                <span className="text-2xl">{h.bank.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">
                    {h.bank.name} 模拟面试
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.createdAt).toLocaleDateString("zh-CN")}
                    {" · "}
                    <DifficultyBadge difficulty={h.difficulty} />
                  </p>
                </div>
                <div className="text-right">
                  {report?.overallScore ? (
                    <span className="text-lg font-bold text-primary">
                      {report.overallScore}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {h.status === "ACTIVE" ? "进行中" : "待报告"}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

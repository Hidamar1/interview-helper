import { notFound } from "next/navigation";
import { getInterviewDetail } from "@/lib/actions/interview";
import { ChatPanel } from "@/components/interview/chat-panel";

export const dynamic = "force-dynamic";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const interview = await getInterviewDetail(id);
  if (!interview) notFound();

  if (interview.status === "FINISHED") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground">该面试已结束</p>
        <a
          href={`/interview/${id}/report`}
          className="mt-4 inline-block rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white"
        >
          查看评分报告
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex items-center gap-3 border-b border-border-warm py-3">
        <span className="text-2xl">{interview.bank.icon}</span>
        <div>
          <h1 className="text-sm font-bold text-ink">
            {interview.bank.name} 模拟面试
          </h1>
          <p className="text-xs text-muted-foreground">
            难度：{interview.difficulty} · 目标 {interview.targetRounds} 轮
          </p>
        </div>
      </div>
      <ChatPanel sessionId={id} />
    </div>
  );
}

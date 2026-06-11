interface FollowUpItem {
  question: string;
  hint: React.ReactNode;
}

export function AnswerLayers({
  brief,
  detail,
  followUps,
}: {
  brief: string;
  detail: React.ReactNode;
  followUps: FollowUpItem[];
}) {
  return (
    <div className="space-y-4">
      {/* ① 30 秒速记：默认展开 */}
      <section className="rounded-card border border-primary/30 bg-cream p-5">
        <h2 className="text-sm font-bold text-primary">⚡ 30 秒速记</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink">{brief}</p>
      </section>

      {/* ② 详解：原生 details，无需 JS 水合 */}
      <details className="group rounded-card border border-border-warm p-5">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-ink [&::-webkit-details-marker]:hidden">
          <span>📖 详解版</span>
          <span className="text-xs font-medium text-primary">
            <span className="group-open:hidden">展开详解</span>
            <span className="hidden group-open:inline">收起详解</span>
          </span>
        </summary>
        <div className="mt-4">{detail}</div>
      </details>

      {/* ③ 追问链：逐个翻开（先想后看），details 各自独立保持展开 */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-ink">🔍 面试官追问</h2>
        {followUps.map((f, i) => (
          <details
            key={f.question}
            className="group rounded-card border border-border-warm p-4 transition-colors open:border-primary/40 open:bg-cream/40"
          >
            <summary className="cursor-pointer list-none text-sm font-medium text-ink [&::-webkit-details-marker]:hidden">
              追问 {i + 1}：{f.question}
              <span className="mt-1 block text-xs font-normal text-muted-foreground group-open:hidden">
                先自己想一想，点击查看提示
              </span>
            </summary>
            <div className="mt-2 text-sm">{f.hint}</div>
          </details>
        ))}
      </section>
    </div>
  );
}

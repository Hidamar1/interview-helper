"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

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
  const [detailOpen, setDetailOpen] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);

  return (
    <div className="space-y-4">
      {/* ① 30 秒速记：默认展开 */}
      <section className="rounded-card border border-primary/30 bg-cream p-5">
        <h2 className="text-sm font-bold text-primary">⚡ 30 秒速记</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink">{brief}</p>
      </section>

      {/* ② 详解：点击展开 */}
      <section className="rounded-card border border-border-warm p-5">
        <button
          type="button"
          onClick={() => setDetailOpen((o) => !o)}
          className="flex w-full items-center justify-between text-sm font-bold text-ink"
        >
          <span>📖 详解版</span>
          <span className="text-xs font-medium text-primary">
            {detailOpen ? "收起详解" : "展开详解"}
          </span>
        </button>
        {detailOpen && <div className="mt-4">{detail}</div>}
      </section>

      {/* ③ 追问链：逐个翻开（先想后看） */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-ink">🔍 面试官追问</h2>
        {followUps.map((f, i) => {
          const open = revealed.includes(i);
          return (
            <div
              key={f.question}
              className={cn(
                "rounded-card border p-4 transition-colors",
                open ? "border-primary/40 bg-cream/40" : "border-border-warm",
              )}
            >
              <button
                type="button"
                className="w-full text-left text-sm font-medium text-ink"
                onClick={() => setRevealed((r) => (r.includes(i) ? r : [...r, i]))}
              >
                追问 {i + 1}：{f.question}
              </button>
              {open ? (
                <div className="mt-2 text-sm">{f.hint}</div>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">先自己想一想，点击查看提示</p>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}

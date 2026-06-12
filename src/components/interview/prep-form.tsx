"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSession } from "@/lib/actions/interview";
import { Button } from "@/components/ui/button";

const DIFFICULTY_OPTIONS = [
  { label: "简单", value: "EASY" },
  { label: "中等", value: "MEDIUM" },
  { label: "困难", value: "HARD" },
] as const;

const ROUND_OPTIONS = [3, 5, 8, 10];

interface Props {
  banks: { id: string; name: string; icon: string; description: string }[];
}

export function PrepForm({ banks }: Props) {
  const router = useRouter();
  const [bankId, setBankId] = useState(banks[0]?.id ?? "");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [targetRounds, setTargetRounds] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bankId) return;
    setLoading(true);
    setError("");
    try {
      const session = await createSession({ bankId, difficulty, targetRounds });
      router.push(`/interview/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-ink">开始 AI 模拟面试</h1>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}

      {/* 面试方向 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">面试方向</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {banks.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBankId(b.id)}
              className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                bankId === b.id
                  ? "border-primary bg-primary/10"
                  : "border-border-warm hover:border-primary"
              }`}
            >
              <span className="text-lg">{b.icon}</span>
              <span className="ml-2 font-medium text-ink">{b.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 难度 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">难度</label>
        <div className="flex gap-2">
          {DIFFICULTY_OPTIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDifficulty(d.value)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                difficulty === d.value
                  ? "bg-primary font-medium text-white"
                  : "bg-cream text-muted-foreground hover:bg-[#FFE8D2]"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* 轮数 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-ink">面试轮数</label>
        <div className="flex gap-2">
          {ROUND_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTargetRounds(r)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                targetRounds === r
                  ? "bg-primary font-medium text-white"
                  : "bg-cream text-muted-foreground hover:bg-[#FFE8D2]"
              }`}
            >
              {r} 轮
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={loading || !bankId} className="w-full rounded-full">
        {loading ? "正在准备面试..." : "开始面试"}
      </Button>
    </form>
  );
}

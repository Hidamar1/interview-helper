import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/question-schema";

const MAP: Record<Difficulty, { label: string; className: string }> = {
  EASY: { label: "简单", className: "bg-emerald-50 text-emerald-600" },
  MEDIUM: { label: "中等", className: "bg-orange-50 text-orange-600" },
  HARD: { label: "困难", className: "bg-red-50 text-red-500" },
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { label, className } = MAP[difficulty];
  return (
    <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}

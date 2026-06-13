import Link from "next/link";
import type { InterviewReport } from "@/lib/prompts/report";

export function WeaknessList({
  weaknesses,
}: {
  weaknesses: InterviewReport["weaknesses"];
}) {
  return (
    <ul className="space-y-3">
      {weaknesses.map((w, i) => (
        <li
          key={i}
          className="rounded-lg border border-border-warm bg-cream/50 p-3 text-sm"
        >
          <p className="font-medium text-ink">
            {i + 1}. {w.point}
          </p>
          <p className="mt-1 text-muted-foreground">{w.suggestion}</p>
          {w.questionSlug && (
            <Link
              href={`/questions/${w.questionSlug}`}
              className="mt-1 inline-block text-xs text-primary underline"
            >
              去复习相关题目 →
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

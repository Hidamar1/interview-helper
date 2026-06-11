import Link from "next/link";
import { DifficultyBadge } from "./difficulty-badge";
import type { Difficulty } from "@/lib/question-schema";

export interface QuestionRowData {
  title: string;
  slug: string;
  difficulty: Difficulty;
  tags: string[];
  viewCount: number;
}

export function QuestionRow({ question }: { question: QuestionRowData }) {
  return (
    <Link
      href={`/questions/${question.slug}`}
      className="flex items-center gap-3 rounded-card border border-border-warm bg-white px-4 py-3 transition-colors hover:border-primary"
    >
      <DifficultyBadge difficulty={question.difficulty} />
      <span className="flex-1 truncate text-sm font-medium text-ink">{question.title}</span>
      <span className="hidden gap-1 sm:flex">
        {question.tags.slice(0, 3).map((t) => (
          <span key={t} className="rounded-full bg-cream px-2 py-0.5 text-xs text-[#B4690E]">
            {t}
          </span>
        ))}
      </span>
      <span className="w-12 text-right font-mono text-xs text-muted-foreground">{question.viewCount}</span>
    </Link>
  );
}

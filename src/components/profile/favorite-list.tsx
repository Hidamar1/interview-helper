import Link from "next/link";
import { DifficultyBadge } from "@/components/question/difficulty-badge";
import { getFavorites } from "@/lib/actions/favorite";

export async function FavoriteList() {
  const favorites = await getFavorites();

  if (favorites.length === 0) {
    return (
      <div className="rounded-lg border border-border-warm bg-cream/50 py-8 text-center text-sm text-muted-foreground">
        还没有收藏题目，去
        <Link href="/banks" className="mx-1 text-primary underline">
          题库
        </Link>
        看看吧
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border-warm">
      {favorites.map((f) => (
        <li key={f.id} className="flex items-center gap-3 py-3">
          <DifficultyBadge difficulty={f.question.difficulty} />
          <Link
            href={`/questions/${f.question.slug}`}
            className="flex-1 text-sm font-medium text-ink hover:text-primary"
          >
            {f.question.title}
          </Link>
          <span className="text-xs text-muted-foreground">
            {f.question.tags.slice(0, 2).join(" · ")}
          </span>
        </li>
      ))}
    </ul>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { toggleFavorite } from "@/lib/actions/favorite";

export function FavoriteButton({
  questionId,
  initialFavorited = false,
}: {
  questionId: string;
  initialFavorited?: boolean;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  async function handleClick() {
    if (!session) {
      router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }
    startTransition(async () => {
      try {
        const result = await toggleFavorite(questionId);
        setFavorited(result.favorited);
        router.refresh();
      } catch {
        // 静默失败
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        favorited
          ? "border-primary bg-primary/10 text-primary"
          : "border-border-warm text-muted-foreground hover:border-primary hover:text-primary"
      }`}
      title={favorited ? "取消收藏" : "收藏"}
    >
      <svg
        className={`size-4 transition-colors ${favorited ? "fill-primary" : "fill-none"}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M12 21l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.18L12 21z" />
      </svg>
      {favorited ? "已收藏" : "收藏"}
    </button>
  );
}

"use client";

import { DuckIcon } from "@/components/duck/duck-icon";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-4 text-center">
      <DuckIcon size={100} />
      <h1 className="text-2xl font-bold text-ink">出了点问题</h1>
      <p className="text-sm text-muted-foreground">{error.message || "请稍后重试"}</p>
      <button
        onClick={reset}
        className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        重试
      </button>
    </div>
  );
}

import Link from "next/link";
import { DuckIcon } from "./duck-icon";

interface DuckEmptyProps {
  type?: "search" | "favorite" | "history" | "general";
  message?: string;
  link?: { href: string; label: string };
}

const DEFAULTS: Record<
  string,
  { icon: "search" | "favorite" | "history" | "general"; message: string; link?: { href: string; label: string } }
> = {
  search: { icon: "search", message: "没找到相关题目，试试换个搜索词", link: { href: "/banks", label: "浏览题库" } },
  favorite: { icon: "favorite", message: "还没有收藏题目", link: { href: "/banks", label: "去题库看看" } },
  history: { icon: "history", message: "还没有面试记录", link: { href: "/interview", label: "开始面试" } },
  general: { icon: "general", message: "这里什么都没有" },
};

export function DuckEmpty({ type = "general", message, link }: DuckEmptyProps) {
  const def = DEFAULTS[type] ?? DEFAULTS.general;

  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <DuckIcon size={80} />
      <p className="text-sm text-muted-foreground">{message ?? def.message}</p>
      {(link ?? def.link) && (
        <Link
          href={(link ?? def.link)!.href}
          className="rounded-full bg-primary px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          {(link ?? def.link)!.label}
        </Link>
      )}
    </div>
  );
}

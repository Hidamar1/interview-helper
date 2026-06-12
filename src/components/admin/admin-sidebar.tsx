"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/admin/banks", label: "题库管理", icon: "📚" },
  { href: "/admin/questions", label: "题目管理", icon: "📝" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            pathname.startsWith(item.href)
              ? "bg-primary/10 font-medium text-primary"
              : "text-ink hover:bg-white/50",
          )}
        >
          <span>{item.icon}</span>
          {item.label}
        </Link>
      ))}
      <hr className="my-2 border-border-warm" />
      <Link
        href="/"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-white/50"
      >
        ← 返回前台
      </Link>
    </nav>
  );

  return (
    <>
      {/* 桌面端：固定侧边栏 */}
      <aside className="hidden w-[220px] shrink-0 border-r border-border-warm bg-white p-4 md:flex md:flex-col">
        <Link href="/admin" className="mb-6 text-sm font-bold text-ink">
          管理后台
        </Link>
        {links}
      </aside>

      {/* 移动端：Sheet 侧滑菜单 */}
      <div className="fixed left-3 top-3 z-50 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              ☰
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[220px] p-4">
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="mb-6 block text-sm font-bold text-ink"
            >
              管理后台
            </Link>
            {links}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

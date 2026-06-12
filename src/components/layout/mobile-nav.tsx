"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/banks", label: "题库", icon: "📚" },
  { href: "/interview", label: "开始面试", icon: "🦆" },
  { href: "/profile", label: "刷题记录", icon: "📊" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="-ml-2">
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[220px] p-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="mb-6 flex items-center gap-2 text-base font-extrabold text-ink"
          >
            <span>面试<em className="not-italic text-primary">突击鸭</em></span>
          </Link>
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
                    : "text-ink hover:bg-muted",
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

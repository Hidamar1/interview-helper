import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DuckIcon } from "@/components/duck/duck-icon";
import { NavLink } from "./nav-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-warm bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2 text-base font-extrabold text-ink">
          <DuckIcon size={28} />
          <span>
            面试<em className="not-italic text-primary">突击鸭</em>
          </span>
        </Link>
        <nav className="flex items-center gap-5">
          <NavLink href="/banks">题库</NavLink>
          <NavLink href="/interview">开始面试</NavLink>
          <NavLink href="/profile">刷题记录</NavLink>
        </nav>
        <Button size="sm" className="ml-auto rounded-full px-5">
          登录
        </Button>
      </div>
    </header>
  );
}

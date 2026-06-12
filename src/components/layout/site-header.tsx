import Link from "next/link";
import { DuckIcon } from "@/components/duck/duck-icon";
import { NavLink } from "./nav-link";
import { UserMenu } from "@/components/auth/user-menu";
import { MobileNav } from "./mobile-nav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-warm bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <MobileNav />
        <Link href="/" className="flex items-center gap-2 text-base font-extrabold text-ink">
          <DuckIcon size={28} />
          <span>
            面试<em className="not-italic text-primary">突击鸭</em>
          </span>
        </Link>
        <nav className="hidden items-center gap-5 sm:flex">
          <NavLink href="/banks">题库</NavLink>
          <NavLink href="/interview">开始面试</NavLink>
          <NavLink href="/profile">刷题记录</NavLink>
        </nav>
        <UserMenu />
      </div>
    </header>
  );
}

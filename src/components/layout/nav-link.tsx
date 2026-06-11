"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "text-sm text-neutral-600 transition-colors hover:text-primary",
        active && "font-semibold text-primary",
      )}
    >
      {children}
    </Link>
  );
}

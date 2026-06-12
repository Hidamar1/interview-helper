"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // 加载中
  if (isPending) {
    return <div className="ml-auto size-8 animate-pulse rounded-full bg-muted" />;
  }

  // 未登录
  if (!session) {
    return (
      <Button size="sm" className="ml-auto rounded-full px-5" onClick={() => router.push("/login")}>
        登录
      </Button>
    );
  }

  // 已登录
  const user = session.user;
  return (
    <div ref={ref} className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full border border-border-warm px-3 py-1.5 text-sm transition-colors hover:bg-cream"
      >
        {user.image ? (
          <img src={user.image} alt="" className="size-6 rounded-full" />
        ) : (
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {(user.name ?? user.email ?? "?")[0].toUpperCase()}
          </span>
        )}
        <span className="max-w-[100px] truncate text-ink">{user.name ?? user.email}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border-warm bg-white py-1 shadow-lg">
          <button
            type="button"
            className="w-full px-4 py-2 text-left text-sm text-ink hover:bg-cream"
            onClick={() => { router.push("/profile"); setOpen(false); }}
          >
            个人中心
          </button>
          {(session.user as { role?: string }).role === "ADMIN" && (
            <>
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm text-ink hover:bg-cream"
                onClick={() => { router.push("/admin"); setOpen(false); }}
              >
                管理后台
              </button>
            </>
          )}
          <hr className="border-border-warm" />
          <button
            type="button"
            className="w-full px-4 py-2 text-left text-sm text-muted-foreground hover:bg-cream"
            onClick={async () => {
              await signOut();
              router.refresh();
              setOpen(false);
            }}
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { DuckIcon } from "@/components/duck/duck-icon";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-4 text-center">
      <DuckIcon size={100} />
      <h1 className="text-2xl font-bold text-ink">404</h1>
      <p className="text-sm text-muted-foreground">找不到这个页面</p>
      <Link
        href="/"
        className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        回到首页
      </Link>
    </div>
  );
}

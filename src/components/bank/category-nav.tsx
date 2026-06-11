import Link from "next/link";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/constants";

export function CategoryNav({ current }: { current?: string }) {
  const items: { label: string; value?: string }[] = [
    { label: "🔥 热门" },
    ...CATEGORIES.map((c) => ({ label: c, value: c as string | undefined })),
  ];
  return (
    <nav className="flex flex-wrap gap-2">
      {items.map(({ label, value }) => (
        <Link
          key={label}
          href={value ? `/banks?category=${encodeURIComponent(value)}` : "/banks"}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm transition-colors",
            current === value
              ? "bg-primary font-medium text-white"
              : "bg-[#FFF4E8] text-[#B4690E] hover:bg-[#FFE8D2]",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

import Link from "next/link";
import { formatCount } from "@/lib/format";

export interface BankCardData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  questionCount: number;
  viewTotal: number;
}

export function BankCard({ bank }: { bank: BankCardData }) {
  return (
    <Link
      href={`/banks/${bank.slug}`}
      className="block rounded-card border border-border-warm bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-lg hover:shadow-orange-100"
    >
      <div className="mb-3 flex size-9 items-center justify-center rounded-[10px] bg-cream text-lg">
        {bank.icon}
      </div>
      <h3 className="text-sm font-semibold text-ink">{bank.name}</h3>
      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{bank.description}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{bank.questionCount} 题</span>
        <b className="font-mono font-semibold text-primary">{formatCount(bank.viewTotal)} 次浏览</b>
      </div>
    </Link>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { QuestionRow } from "@/components/question/question-row";
import { getBankDetail } from "@/lib/queries/banks";
import { difficultySchema } from "@/lib/question-schema";

export const dynamic = "force-dynamic";

const FILTERS = [
  { label: "全部", value: undefined },
  { label: "简单", value: "EASY" },
  { label: "中等", value: "MEDIUM" },
  { label: "困难", value: "HARD" },
] as const;

export default async function BankDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ difficulty?: string | string[] }>;
}) {
  const { slug } = await params;
  const { difficulty: raw } = await searchParams;
  const parsed = difficultySchema.safeParse(raw);
  const difficulty = parsed.success ? parsed.data : undefined;

  const bank = await getBankDetail(slug, difficulty);
  if (!bank) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
        <div className="flex size-14 items-center justify-center rounded-card bg-cream text-3xl">
          {bank.icon}
        </div>
        <div>
          <h1 className="text-xl font-bold text-ink">{bank.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{bank.description}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/banks/${slug}?difficulty=${f.value}` : `/banks/${slug}`}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              difficulty === f.value
                ? "bg-primary font-medium text-white"
                : "bg-[#FFF4E8] text-[#B4690E] hover:bg-[#FFE8D2]",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {bank.items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">该难度下暂无题目</p>
        ) : (
          bank.items.map(({ question }) => <QuestionRow key={question.id} question={question} />)
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bank = await getBankDetail(slug);
  return bank ? { title: bank.name, description: bank.description } : {};
}

import { DuckIcon } from "@/components/duck/duck-icon";
import { CategoryNav } from "@/components/bank/category-nav";
import { BankCard } from "@/components/bank/bank-card";
import { getBanksWithStats } from "@/lib/queries/banks";

export const dynamic = "force-dynamic";
export const metadata = { title: "题库" };

export default async function BanksPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const banks = await getBanksWithStats(category);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-xl font-bold text-ink">题库</h1>
      <div className="mt-4">
        <CategoryNav current={category} />
      </div>
      {banks.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <DuckIcon size={72} />
          <p className="mt-4 text-sm">这个分类还没有题库，换个分类看看吧</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {banks.map((b) => (
            <BankCard key={b.id} bank={b} />
          ))}
        </div>
      )}
    </div>
  );
}

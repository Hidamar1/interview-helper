import { DuckIcon } from "@/components/duck/duck-icon";
import { CategoryNav } from "@/components/bank/category-nav";
import { BankCard } from "@/components/bank/bank-card";
import { getBanksWithStats } from "@/lib/queries/banks";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const banks = await getBanksWithStats();
  const totalQuestions = banks.reduce((s, b) => s + b.questionCount, 0);

  return (
    <>
      <section className="bg-[linear-gradient(135deg,#FFF7ED_0%,#FFEDD5_60%,#FED7AA_100%)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-14">
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold leading-snug text-ink">
              把八股文，刷成<em className="not-italic text-primary">肌肉记忆</em>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {totalQuestions}+ 道高频面试题 · AI 面试官追问 · 程序员求职刷题神器
            </p>
            <form
              action="/search"
              className="mt-6 flex w-full max-w-md items-center rounded-full border-2 border-primary bg-white py-1 pl-5 pr-1"
            >
              <input
                name="q"
                required
                placeholder="搜索题目，如：HashMap 扩容机制…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-300"
              />
              <button
                type="submit"
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                搜索
              </button>
            </form>
          </div>
          <div className="hidden sm:block">
            <DuckIcon size={130} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <CategoryNav />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {banks.map((b) => (
            <BankCard key={b.id} bank={b} />
          ))}
        </div>
      </div>
    </>
  );
}

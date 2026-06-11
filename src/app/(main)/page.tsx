import { DuckIcon } from "@/components/duck/duck-icon";

export default function HomePage() {
  return (
    <section className="bg-[linear-gradient(135deg,#FFF7ED_0%,#FFEDD5_60%,#FED7AA_100%)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-16">
        <div>
          <h1 className="text-4xl font-bold text-ink">
            把八股文，刷成<em className="not-italic text-primary">肌肉记忆</em>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            高频面试题 · AI 面试官追问 · 程序员求职刷题神器
          </p>
        </div>
        <DuckIcon size={120} />
      </div>
    </section>
  );
}

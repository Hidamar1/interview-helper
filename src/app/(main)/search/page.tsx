import { DuckIcon } from "@/components/duck/duck-icon";
import { QuestionRow } from "@/components/question/question-row";
import { searchQuestions } from "@/lib/queries/questions";
import { firstParam } from "@/lib/question-schema";

export const dynamic = "force-dynamic";
export const metadata = { title: "搜索" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const keyword = firstParam(q)?.trim() ?? "";
  const results = keyword ? await searchQuestions(keyword) : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-xl font-bold text-ink">
        「{keyword}」的搜索结果
        <span className="ml-2 font-mono text-sm font-normal text-muted-foreground">
          {results.length} 条
        </span>
      </h1>
      {results.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <DuckIcon size={72} />
          <p className="mt-4 text-sm">没找到相关题目，换个关键词试试（如：索引、HashMap）</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {results.map((question) => (
            <QuestionRow key={question.id} question={question} />
          ))}
        </div>
      )}
    </div>
  );
}

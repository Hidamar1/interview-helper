import type { InterviewReport } from "@/lib/prompts/report";

export function ScoreCard({ report }: { report: InterviewReport }) {
  const dims = report.dimensions;

  return (
    <div className="space-y-3">
      <div className="text-center">
        <span className="text-4xl font-bold text-primary">{report.overallScore}</span>
        <span className="ml-1 text-sm text-muted-foreground">/ 100</span>
      </div>
      <div className="grid grid-cols-5 gap-2 text-center">
        {[
          { key: "knowledge", label: "知识广度" },
          { key: "depth", label: "理解深度" },
          { key: "expression", label: "表达" },
          { key: "logic", label: "逻辑" },
          { key: "adaptability", label: "应变" },
        ].map(({ key, label }) => (
          <div key={key}>
            <div className="text-lg font-bold text-ink">
              {dims[key as keyof typeof dims]}
            </div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

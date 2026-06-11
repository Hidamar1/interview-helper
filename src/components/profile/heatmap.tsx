/**
 * GitHub 风格日历热力图——橙色 5 级梯度。
 * 数据：最近 365 天，按周排列（53 列 × 7 行）。
 */

const LEVEL_COLORS = [
  "bg-[#FFF7ED]",        // 0 次
  "bg-[#FFD9A3]",        // 1 次
  "bg-[#FFB01F]",        // 2 次
  "bg-[#FF8C00]",        // 3 次
  "bg-[#FF7D00]",        // 4+ 次
];

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

interface HeatmapProps {
  data: { date: string; count: number }[];
}

export function Heatmap({ data }: HeatmapProps) {
  const countMap = new Map(data.map((d) => [d.date, d.count]));

  // 从今天往回数 364 天，对齐到周日
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  // 生成 53 周 × 7 天网格
  const weeks: { date: string; count: number; label: string }[][] = [];
  const totalDays = 371;
  let currentWeek: { date: string; count: number; label: string }[] = [];

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const count = countMap.get(key) ?? 0;
    currentWeek.push({ date: key, count, label: `${key}: ${count} 题` });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // 月份标签：收集每周第一天所在的月份（仅当月第一天 <= 7 号时标注）
  const monthLabels: { col: number; label: string }[] = [];
  weeks.forEach((week, colIdx) => {
    if (week[0]) {
      const d = new Date(week[0].date);
      if (d.getDate() <= 7) {
        monthLabels.push({ col: colIdx, label: `${d.getMonth() + 1}月` });
      }
    }
  });

  return (
    <div className="overflow-x-auto">
      {/* 月份标签行 */}
      <div className="mb-1 ml-8 text-xs text-muted-foreground" style={{ whiteSpace: "pre" }}>
        {Array.from({ length: weeks.length }, (_, i) => {
          const month = monthLabels.find((m) => m.col === i);
          return month ? month.label : "  ";
        }).join(" ")}
      </div>
      <div className="flex">
        {/* 星期标签 */}
        <div className="mr-2 flex flex-col gap-[2px] pt-[2px] text-[10px] text-muted-foreground">
          <span className="h-[13px] leading-[13px]">一</span>
          <span className="h-[13px] leading-[13px]">三</span>
          <span className="h-[13px] leading-[13px]">五</span>
        </div>
        {/* 格子矩阵 */}
        <div className="flex gap-[2px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={day.label}
                  className={`h-[13px] w-[13px] rounded-sm ${LEVEL_COLORS[getLevel(day.count)]}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* 图例 */}
      <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
        <span>少</span>
        {LEVEL_COLORS.map((color, i) => (
          <div key={i} className={`h-[13px] w-[13px] rounded-sm ${color}`} />
        ))}
        <span>多</span>
      </div>
    </div>
  );
}

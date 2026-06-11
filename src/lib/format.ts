/** 格式化计数展示（定义域：非负整数，如题目数/浏览量） */
export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
}

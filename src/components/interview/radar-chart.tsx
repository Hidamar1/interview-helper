interface RadialData {
  knowledge: number;
  depth: number;
  expression: number;
  logic: number;
  adaptability: number;
}

const LABELS = ["知识广度", "理解深度", "表达能力", "逻辑思维", "应变能力"];
const KEYS: (keyof RadialData)[] = ["knowledge", "depth", "expression", "logic", "adaptability"];

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 90;
const LEVELS = 5;

export function RadarChart({ data }: { data: RadialData }) {
  const angles = KEYS.map((_, i) => (Math.PI * 2 * i) / KEYS.length - Math.PI / 2);

  // 计算数据多边形顶点
  const points = KEYS.map((k, i) => {
    const r = (data[k] / 100) * RADIUS;
    return {
      x: CENTER + r * Math.cos(angles[i]),
      y: CENTER + r * Math.sin(angles[i]),
    };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // 网格层级
  const gridLevels = Array.from({ length: LEVELS }, (_, l) => {
    const r = ((l + 1) / LEVELS) * RADIUS;
    return KEYS.map((_, i) => ({
      x: CENTER + r * Math.cos(angles[i]),
      y: CENTER + r * Math.sin(angles[i]),
    }));
  });

  // 轴标签
  const axisLabels = KEYS.map((_, i) => {
    const lx = CENTER + RADIUS * Math.cos(angles[i]) * 1.15;
    const ly = CENTER + RADIUS * Math.sin(angles[i]) * 1.15;
    return { x: lx, y: ly, label: LABELS[i] };
  });

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-[240px]">
      {/* 网格 */}
      {gridLevels.map((level, li) => (
        <polygon
          key={li}
          points={level.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="#F3E7D8"
          strokeWidth={1}
        />
      ))}
      {/* 轴 */}
      {KEYS.map((_, i) => (
        <line
          key={i}
          x1={CENTER}
          y1={CENTER}
          x2={CENTER + RADIUS * Math.cos(angles[i])}
          y2={CENTER + RADIUS * Math.sin(angles[i])}
          stroke="#F3E7D8"
          strokeWidth={1}
        />
      ))}
      {/* 数据多边形 */}
      <polygon
        points={polygonPoints}
        fill="#FF7D00"
        fillOpacity={0.2}
        stroke="#FF7D00"
        strokeWidth={2}
      />
      {/* 数据点 */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#FF7D00" />
      ))}
      {/* 标签 */}
      {axisLabels.map((a, i) => (
        <text
          key={i}
          x={a.x}
          y={a.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-ink text-[8px]"
          fontWeight={500}
        >
          {a.label}
        </text>
      ))}
    </svg>
  );
}

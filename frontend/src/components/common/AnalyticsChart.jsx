import { useMemo } from "react";
import { FiEye, FiMousePointer, FiHeart, FiBookmark } from "react-icons/fi";

/* ==========================================
   ANALYTICS CHART
   Lightweight, dependency-free SVG multi-line
   chart for rendering tool traffic data.
   ========================================== */

const SERIES = [
  { key: "views", label: "Views", color: "stroke-emerald-400", fill: "fill-emerald-500/10", Icon: FiEye },
  { key: "clicks", label: "Clicks", color: "stroke-cyan-400", fill: "fill-cyan-500/10", Icon: FiMousePointer },
  { key: "likes", label: "Likes", color: "stroke-amber-400", fill: "fill-amber-500/10", Icon: FiHeart },
  { key: "saves", label: "Saves", color: "stroke-rose-400", fill: "fill-rose-500/10", Icon: FiBookmark },
];

// Parse "YYYY-MM-DD" into a short, readable label ("05 Jan").
const formatDateLabel = (iso) => {
  const d = new Date(iso);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]}`;
};

export default function AnalyticsChart({ data, height = 240, visible = ["views", "clicks", "likes", "saves"] }) {
  const series = useMemo(
    () => SERIES.filter((s) => visible.includes(s.key)),
    [visible]
  );

  const values = useMemo(() => {
    if (!data || data.length === 0) return { max: 0, points: [] };
    const all = data.flatMap((d) => series.map((s) => d[s.key] || 0));
    return { max: Math.max(1, ...all), points: data };
  }, [data, series]);

  const visibleSeries = series.length === 0 ? SERIES.slice(0, 2) : series;
  const maxVal = values.max;
  const points = values.points;
  const n = points.length;

  // SVG layout constants
  const padding = { top: 16, right: 24, bottom: 32, left: 36 };
  const viewBoxW = 720;
  const viewBoxH = height + padding.top + padding.bottom;
  const plotW = viewBoxW - padding.left - padding.right;
  const plotH = height;
  const x = (i) => padding.left + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const y = (v) => padding.top + plotH - (maxVal > 0 ? (v / maxVal) * plotH : 0);

  // Horizontal gridlines (5 steps)
  const gridSteps = 5;

  if (!n) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500">
        No traffic data available yet.
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-3">
        {visibleSeries.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-xs text-slate-400">
            <span className={`h-3 w-3 rounded-full ${s.color.replace("stroke-", "bg-")}`}></span>
            <s.Icon className={`h-3.5 w-3.5 ${s.color.replace("stroke-", "text-").replace("-400", "-400")}`} />
            <span className="text-slate-300">{s.label}</span>
          </div>
        ))}
      </div>

      <svg width="100%" viewBox={`0 0 ${viewBoxW} ${viewBoxH}`} className="block h-full w-full">
        {/* Background */}
        <rect x={padding.left} y={padding.top} width={plotW} height={plotH} rx="8" className="fill-slate-900/60" />

        {/* Gridlines */}
        {Array.from({ length: gridSteps + 1 }).map((_, i) => {
          const gy = padding.top + (plotH / gridSteps) * i;
          const val = maxVal - (maxVal / gridSteps) * i;
          return (
            <g key={i}>
              <line x1={padding.left} y1={gy} x2={padding.left + plotW} y2={gy} className="stroke-slate-800" strokeWidth="1" />
              <text x={padding.left - 6} y={gy + 4} textAnchor="end" className="fill-slate-500 text-[10px]">
                {val > 0 ? Math.round(val) : 0}
              </text>
            </g>
          );
        })}

        {visibleSeries.map((s) => {
          // Build the polyline points string.
          const pts = points
            .map((d, i) => `${x(i)},${y(d[s.key] || 0)}`)
            .join(" ");

          // Build the area polygon (under the line, down to the bottom).
          const areaPts = `${pts} ${padding.left + plotW},${padding.top + plotH} ${padding.left},${padding.top + plotH}`;

          return (
            <g key={s.key}>
              {/* Area */}
              <polygon points={areaPts} className={`${s.fill} opacity-60`} />
              {/* Line */}
              <polyline points={pts} fill="none" className={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {/* Points */}
              {points.map((d, i) => (
                <circle key={i} cx={x(i)} cy={y(d[s.key] || 0)} r="3" className={s.color.replace("stroke-", "fill-")} />
              ))}
            </g>
          );
        })}

        {/* X axis labels (first, middle, last) */}
        {n > 0 && (
          <g className="fill-slate-500 text-[10px]">
            <text x={padding.left} y={padding.top + plotH + 16} textAnchor="start">{formatDateLabel(points[0].date)}</text>
            {n > 2 && (
              <text x={x(Math.floor(n / 2))} y={padding.top + plotH + 16} textAnchor="middle">{formatDateLabel(points[Math.floor(n / 2)].date)}</text>
            )}
            <text x={padding.left + plotW} y={padding.top + plotH + 16} textAnchor="end">{formatDateLabel(points[n - 1].date)}</text>
          </g>
        )}
      </svg>
    </div>
  );
}

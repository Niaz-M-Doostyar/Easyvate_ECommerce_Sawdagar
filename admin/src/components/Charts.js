"use client";

export function BarChart({ data = [], dataKey = "value", labelKey = "label", color = "#38B6FF", height = 200 }) {
  if (!data.length) return <div className="text-center text-body text-sm py-8">No data</div>;

  const maxVal = Math.max(...data.map((d) => d[dataKey] || 0), 1);

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => {
        const val = d[dataKey] || 0;
        const pct = (val / maxVal) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-navy text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {typeof val === "number" ? val.toLocaleString(undefined, { maximumFractionDigits: 0 }) : val}
            </div>
            <div
              className="w-full rounded-t-sm transition-all duration-300 ease-out min-h-[2px]"
              style={{ height: `${Math.max(pct, 1)}%`, backgroundColor: color }}
            />
            <span className="text-[9px] text-body mt-1 truncate w-full text-center leading-tight">
              {d[labelKey] || ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function MiniLineChart({ data = [], dataKey = "value", color = "#38B6FF", height = 60, width = "100%" }) {
  if (!data.length) return null;

  const values = data.map((d) => d[dataKey] || 0);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const svgWidth = 300;
  const svgHeight = height;
  const padding = 2;

  const points = values.map((v, i) => {
    const x = padding + (i / Math.max(values.length - 1, 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - ((v - minVal) / range) * (svgHeight - padding * 2);
    return `${x},${y}`;
  });

  const pathD = points.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(" ");
  const areaD = `${pathD} L${svgWidth - padding},${svgHeight - padding} L${padding},${svgHeight - padding} Z`;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width, height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color.replace("#", "")})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DonutChart({ segments = [], size = 120, strokeWidth = 16 }) {
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dashArray = `${circumference * pct} ${circumference * (1 - pct)}`;
        const rotation = offset * 360 - 90;
        offset += pct;
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color || "#38B6FF"}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            strokeDashoffset="0"
            transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
            strokeLinecap="round"
          />
        );
      })}
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="text-xl font-bold" fill="#053262">
        {total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </text>
    </svg>
  );
}

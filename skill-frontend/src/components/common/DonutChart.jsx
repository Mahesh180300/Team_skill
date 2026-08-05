import { useState } from "react";

const R = 70, CX = 90, CY = 90, STROKE = 22;
const CIRCUMFERENCE = 2 * Math.PI * R;
const GAP = 3;

export default function DonutChart({ slices = [], centerLabel = "Total", itemLabel = "item" }) {
  const [tooltip, setTooltip] = useState(null);

  const total = slices.reduce((s, l) => s + l.count, 0);

  if (!total) {
    return (
      <div className="donut-empty">
        <span className="donut-empty-icon">📊</span>
        <p>No data yet.</p>
      </div>
    );
  }

  let offset = 0;
  const arcs = slices.map((l) => {
    const dash = Math.max(0, (l.count / total) * CIRCUMFERENCE - GAP);
    const arc = { ...l, dash, offset, percentage: Math.round((l.count / total) * 100) };
    offset += (l.count / total) * CIRCUMFERENCE;
    return arc;
  });

  const handleMouseMove = (e, arc) => {
    const rect = e.currentTarget.closest("svg").getBoundingClientRect();
    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, ...arc });
  };

  return (
    <div className="donut-wrapper">
      <div className="donut-chart-area" style={{ position: "relative" }}>
        <svg viewBox="0 0 180 180" className="donut-svg" onMouseLeave={() => setTooltip(null)}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={arc.color}
              strokeWidth={STROKE}
              strokeDasharray={`${arc.dash} ${CIRCUMFERENCE}`}
              strokeDashoffset={-arc.offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${CX} ${CY})`}
              className="donut-arc"
              onMouseMove={(e) => handleMouseMove(e, arc)}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
          <text x={CX} y={CY - 10} textAnchor="middle" className="donut-center-label">{centerLabel}</text>
          <text x={CX} y={CY + 16} textAnchor="middle" className="donut-center-count">{total}</text>
        </svg>

        {tooltip && (
          <div style={{ position: "absolute", left: tooltip.x + 12, top: tooltip.y - 10, background: "#2e2e44", color: "#fff", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 500, pointerEvents: "none", whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.18)", zIndex: 10, lineHeight: 1.6, borderLeft: `3px solid ${tooltip.color}` }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{tooltip.label}</div>
            <div style={{ color: "rgba(255,255,255,0.75)" }}>
              {tooltip.count} {tooltip.count === 1 ? itemLabel : `${itemLabel}s`} · {tooltip.percentage}%
            </div>
          </div>
        )}
      </div>

      <div className="donut-legend">
        {slices.map((l) => (
          <div key={l.key} className="donut-legend-row">
            <span className="donut-legend-dot" style={{ background: l.color }} />
            <span className="donut-legend-label">{l.label}</span>
            <span className="donut-legend-count">{l.count} {l.count === 1 ? itemLabel : `${itemLabel}s`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

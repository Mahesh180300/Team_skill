import { useState } from "react";

const LEVELS = [
  { key: "Beginner",     label: "Beginner",     color: "#2e2f41" },
  { key: "Intermediate", label: "Intermediate", color: "#797c89" },
  { key: "Advanced",     label: "Advanced",     color: "#bec3d0" },
];

const R = 70;
const CX = 90;
const CY = 90;
const STROKE = 22;
const CIRCUMFERENCE = 2 * Math.PI * R;
const GAP = 3;

function buildData(skills) {
  const counts = { Beginner: 0, Intermediate: 0, Advanced: 0 };
  for (const s of skills) {
    if (s.proficiency in counts) counts[s.proficiency]++;
  }
  const total = counts.Beginner + counts.Intermediate + counts.Advanced;
  const pct = (n) => (total === 0 ? 0 : Math.round((n / total) * 100));
  return {
    total,
    levels: LEVELS.map((l) => ({
      ...l,
      count: counts[l.key],
      percentage: pct(counts[l.key]),
    })),
  };
}

function buildArcs(levels, total) {
  if (!total) return [];
  let offset = 0;
  return levels.map((l) => {
    const fraction = l.count / total;
    const dash = Math.max(0, fraction * CIRCUMFERENCE - GAP);
    const arc = { ...l, dash, offset };
    offset += fraction * CIRCUMFERENCE;
    return arc;
  });
}

export default function SkillDonutChart({ skills }) {
  const { total, levels } = buildData(skills || []);
  const [tooltip, setTooltip] = useState(null); // { x, y, label, count, percentage, color }

  if (!total) {
    return (
      <div className="donut-empty">
        <span className="donut-empty-icon">📊</span>
        <p>No skills added yet.</p>
      </div>
    );
  }

  const arcs = buildArcs(levels, total);

  const handleMouseMove = (e, arc) => {
    const rect = e.currentTarget.closest("svg").getBoundingClientRect();
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      label: arc.label,
      count: arc.count,
      percentage: arc.percentage,
      color: arc.color,
    });
  };

  return (
    <div className="donut-wrapper">
      <div className="donut-chart-area" style={{ position: "relative" }}>
        <svg
          viewBox="0 0 180 180"
          className="donut-svg"
          onMouseLeave={() => setTooltip(null)}
        >
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
          <text x={CX} y={CY - 10} textAnchor="middle" className="donut-center-label">Total Skills</text>
          <text x={CX} y={CY + 16} textAnchor="middle" className="donut-center-count">{total}</text>
        </svg>

        {tooltip && (
          <div
            style={{
              position: "absolute",
              left: tooltip.x + 12,
              top: tooltip.y - 10,
              background: "#2e2e44",
              color: "#fff",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 500,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
              zIndex: 10,
              lineHeight: 1.6,
              borderLeft: `3px solid ${tooltip.color}`,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{tooltip.label}</div>
            <div style={{ color: "rgba(255,255,255,0.75)" }}>
              {tooltip.count} {tooltip.count === 1 ? "skill" : "skills"} · {tooltip.percentage}%
            </div>
          </div>
        )}
      </div>

      <div className="donut-legend">
        {levels.map((l) => (
          <div key={l.key} className="donut-legend-row">
            <span className="donut-legend-dot" style={{ background: l.color }} />
            <span className="donut-legend-label">{l.label}</span>
            <span className="donut-legend-count">{l.count} {l.count === 1 ? "skill" : "skills"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const BARS = [
  { key: "primarySkills",   label: "Primary Skills",   color: "#4eb9b0" },
  { key: "secondarySkills", label: "Secondary Skills", color: "#4ee0cc" },
];

const BAR_HEIGHT = 22;
const BAR_GAP    = 20;
const LABEL_W    = 10;
const COUNT_W    = 36;
const PADDING    = 10;

export default function SkillTypeBarChart({ primarySkills = 0, secondarySkills = 0 }) {
  const data = { primarySkills, secondarySkills };
  const total = primarySkills + secondarySkills;

  const svgW  = 390;
  const trackW = svgW - LABEL_W - COUNT_W - PADDING * 2;
  const svgH  = PADDING + BARS.length * (BAR_HEIGHT + BAR_GAP) - BAR_GAP + PADDING;

  if (!total) {
    return (
      <div className="donut-empty">
        <span className="donut-empty-icon"></span>
        <p>No skill data available yet.</p>
      </div>
    );
  }

  return (
    <div className="bar-chart-wrapper">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="bar-chart-svg">
        {BARS.map((bar, i) => {
          const count   = data[bar.key];
          const fillPct = total === 0 ? 0 : count / total;
          const fillW   = Math.max(fillPct * trackW, count > 0 ? 4 : 0);
          const y       = PADDING + i * (BAR_HEIGHT + BAR_GAP);
          const barMid  = y + BAR_HEIGHT / 2;

          return (
            <g key={bar.key}>
              {/* label */}
              {/* <text
                x={PADDING}
                y={barMid + 5}
                className="bar-label"
                fill="#374151"
              >
                {bar.label}
              </text> */}

              {/* track */}
              <rect
                x={PADDING + LABEL_W}
                y={y}
                width={trackW}
                height={BAR_HEIGHT}
                rx={8}
                fill="#e6f1f1"
              />

              {/* fill */}
              <rect
                x={PADDING + LABEL_W}
                y={y}
                width={fillW}
                height={BAR_HEIGHT}
                rx={8}
                fill={bar.color}
                className="bar-fill"
              >
                <title>{`${bar.label}: ${count} skill${count !== 1 ? "s" : ""}`}</title>
              </rect>

              {/* count */}
              <text
                x={PADDING + LABEL_W + trackW + 10}
                y={barMid + 5}
                className="bar-count"
                fill={bar.color}
              >
              {total === 0 ? "0" : Math.round((data[bar.key] / total) * 100)}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* legend */}
      <div className="bar-legend">
        {BARS.map((bar) => (
          <div key={bar.key} className="bar-legend-row">
            <span className="bar-legend-dot" style={{ background: bar.color }} />
            <span className="bar-legend-label">{bar.label}</span>
            <span className="bar-legend-count">{data[bar.key]} skills</span>
          </div>
        ))}
      </div>
    </div>
  );
}

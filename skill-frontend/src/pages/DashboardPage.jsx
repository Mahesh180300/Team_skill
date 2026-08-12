import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import Loader from "../components/Loader";
import Breadcrumb from "../components/common/Breadcrumb";
import { ROUTES } from "../router/routes";
import DonutChart from "../components/common/DonutChart";
import { useState } from "react";

const CERT_SLICES_DEF = [
  { key: "active",       label: "Active",       color: "#1ba54d" },
  { key: "expiringSoon", label: "Expiring Soon", color: "#F59E0B" },
  { key: "expired",      label: "Expired",       color: "#EF4444" },
];

export default function DashboardPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    setLoadingStats(true);
    api.getStats(token).then((data) => {
      setStats(data);
      setLoadingStats(false);
    });
  }, []);

  if (loadingStats) return <Loader fullScreen message="Loading dashboard..." />;

const PROF_COLORS = {
  Advanced: "#34A853",      // Green
  Intermediate: "#4285F4",  // Blue
  Beginner: "#F4B400",      // Yellow / Amber
};

  return (
    <div className="page">
      <div className="page-header"><h2>Dashboard</h2></div>
      <Breadcrumb />

      <div className="profile-stats">
        <div className="psc psc-purple">
          <div className="psc-icon-wrap">
            <span className="psc-icon"><i class="fas fa-users"></i></span>
          </div>
          <div className="psc-body">
            <span className="psc-value">{stats.totalEmployees}</span>
            <span className="psc-label">Total Employees</span>
            <span className="psc-sub">Registered in system</span>
          </div>
        </div>

        <div className="psc psc-blue">
          <div className="psc-icon-wrap">
            <span className="psc-icon"><i class="fas fa-code"></i></span>
          </div>
          <div className="psc-body">
            <span className="psc-value">{stats.topSkills.length}</span>
            <span className="psc-label">Unique Skills</span>
            <span className="psc-sub">Across all employees</span>
          </div>
        </div>

        <div className="psc psc-green">
          <div className="psc-icon-wrap">
            <span className="psc-icon"><i class="fas fa-building"></i></span>
          </div>
          <div className="psc-body">
            <span className="psc-value">{stats.departmentDistribution.length}</span>
            <span className="psc-label">Departments</span>
            <span className="psc-sub">Active departments</span>
          </div>
        </div>

        <div className="psc psc-orange">
          <div className="psc-icon-wrap">
            <span className="psc-icon"><i class="fas fa-exclamation-triangle"></i></span>
          </div>
          <div className="psc-body">
            <span className="psc-value">{stats.skillGapCount}</span>
            <span className="psc-label">Skill Gap</span>
            <span className="psc-sub">Employees with no skills</span>
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="card dash-card">
          <h3> Top Skills</h3>
          <hr />
          
<div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
  {['Advanced', 'Intermediate', 'Beginner'].map(l => (
    <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
      <span style={{ width: 10, height: 10, borderRadius: 2, background: PROF_COLORS[l], display: 'inline-block' }} />{l}
    </span>
  ))}
</div>
<div className={`skill-vbars ${stats.topSkills.length > 6 ? 'scrollable' : ''}`}>
  {(() => {
    const maxCount = stats.topSkills[0]?.count || 1;
    return stats.topSkills.map((s) => {
      const total = s.count || 1;
      const barHeightPct = (s.count / maxCount) * 100;
      const segs = [
        { key: 'Advanced',     val: s.advanced     || 0 },
        { key: 'Intermediate', val: s.intermediate || 0 },
        { key: 'Beginner',     val: s.beginner     || 0 },
      ];
      return (
        <div key={s.name} className="skill-vbar-col">
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{s.count}</span>
          <div className="skill-vbar-track" style={{ background: '#e9ecef', borderRadius: 6, width: '60%' }}>
            <div style={{ width: '100%', height: `${barHeightPct}%`, display: 'flex', flexDirection: 'column-reverse', overflow: 'hidden', borderRadius: 6 }}>
              {segs.map(({ key, val }) => {
                const pct = Math.round((val / total) * 100);
                if (!pct) return null;
                return (
                  <div key={key} style={{ width: '100%', height: `${pct}%`, background: PROF_COLORS[key], position: 'relative', cursor: 'default', flexShrink: 0 }}
                    title={`${key}: ${val} employee${val !== 1 ? 's' : ''} (${pct}%)`}>
                    <span className="skill-vbar-tooltip">{val} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
          <span className="skill-vbar-name">{s.name}</span>
        </div>
      );
    });
  })()}
</div>
</div>

        <div className="card dash-card">
          <h3>Department Distribution</h3>
          <hr />
          {stats.departmentDistribution.length === 0 ? (
            <p className="empty-sm">No department data yet.</p>
          ) : (
            <div className="dept-list" style={stats.departmentDistribution.length > 4 ? { maxHeight: '180px', overflowY: 'auto' } : {}}>
              {stats.departmentDistribution.map((d) => (
                <div key={d.department} className="dept-row">
                  <span className="dept-name">{d.department || "Unassigned"}</span>
                  <span className="dept-count badge badge-dept">{d.count} employee{d.count !== 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Certification Status + Recent Joiners */}
      <div className="dashboard-row" style={{ marginTop: '20px' }}>

          {/* Recent Joiners */}
        <div className="card dash-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Recent Joiners</h3>
            <button onClick={() => navigate(ROUTES.EMPLOYEES)} style={{ fontSize: 12, fontWeight: 600, color: '#6b6d8b', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>View All →</button>
          </div>
          <hr />
          {(stats.recentJoiners || []).length === 0 ? (
            <p className="empty-sm">No joining data yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(stats.recentJoiners || []).map((e) => {
                const formatted = e.createdAt
                  ? new Date(e.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '—';
                return (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'var(--bg)', borderRadius: '8px' }}>
                    <div className="emp-avatar" style={{ width: 38, height: 38, borderRadius: '50%', background: '#2e2f41', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                      {e.avatar
                        ? <img src={e.avatar} alt={e.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        : (e.firstName || e.name)?.charAt(0).toUpperCase()
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.department || '—'}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#6b6d8b', whiteSpace: 'nowrap', flexShrink: 0 }}>{formatted}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Certification Status */}
        <div className="card dash-card">
          <h3>Certification Status</h3>
          <hr />
          <DonutChart
            slices={CERT_SLICES_DEF.map((s) => ({ ...s, count: stats.certStatus?.[s.key] || 0 }))}
            centerLabel="Total"
            itemLabel="cert"
          />
        </div>

      </div>

      {/* Workforce Allocation */}
      {(() => {
        const billable    = stats.billableCount    ?? 0;
        const nonBillable = stats.nonBillableCount ?? 0;
        const total       = stats.totalEmployees   || 1;
        const billablePct    = Math.round((billable    / total) * 100);
        const nonBillablePct = Math.round((nonBillable / total) * 100);
        const rows = [
          { label: 'Total Employees', count: total,       pct: 100,            color: '#476ec1', track: '#dbe8fd' },
          { label: 'Billable',        count: billable,    pct: billablePct,    color: '#32c066', track: '#dcfce7' },
          { label: 'Non-Billable',    count: nonBillable, pct: nonBillablePct, color: '#f4ac30', track: '#fef3c7' },
        ];
        return (
          <div className="card" style={{ marginTop: '20px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Employee Billing Status</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Billable vs Non-Billable breakdown</span>
            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '14px 0 20px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {rows.map(({ label, count, pct, color, track }) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 48px 52px', alignItems: 'center', gap: '0 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{label}</span>
                  </div>
                  <div style={{ height: 20, borderRadius: 4, background: track, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.7s ease' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color, textAlign: 'right' }}>{pct}%</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{count} emp</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

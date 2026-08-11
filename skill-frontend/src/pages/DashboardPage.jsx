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
  { key: "active",       label: "Active",       color: "#44d459" },
  { key: "expiringSoon", label: "Expiring Soon", color: "#ea9b48" },
  { key: "expired",      label: "Expired",       color: "#f0473e" },
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

  const maxSkillCount = stats.topSkills[0]?.count || 1;
  const BAR_COLORS = ["#2e2f41"]
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
          {stats.topSkills.length === 0 ? (
            <p className="empty-sm">No skills data yet.</p>
          ) : (
            <div className="skill-vbars">
              {stats.topSkills.map((s, i) => (
                <div key={s.name} className="skill-vbar-col">
                  <div className="skill-vbar-track">
                    <div
                      className="skill-vbar-fill"
                      style={{ height: `${(s.count / maxSkillCount) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                    >
                      <span className="skill-vbar-tooltip">{s.count}</span>
                    </div>
                  </div>
                  <span className="skill-vbar-name">{s.name}</span>
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
}

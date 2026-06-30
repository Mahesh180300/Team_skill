import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import Loader from "../components/Loader";

export default function DashboardPage() {
  const { token } = useAuth();
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

  return (
    <div className="page">
      <div className="page-header"><h2>Dashboard</h2></div>

      <div className="stats-grid">
        <div className="stat-card stat-info">
          <div className="stat-val">{stats.totalEmployees}</div>
          <div className="stat-lbl">Total Employees</div>
        </div>
        <div className="stat-card stat-info">
         <div className="stat-val">{stats.topSkills.length}</div>
          <div className="stat-lbl">Unique Skills</div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-val">{stats.departmentDistribution.length}</div>
          <div className="stat-lbl">Departments</div>
        </div>
        <div className="stat-card stat-info">
         <div className="stat-val">{stats.skillGapCount}</div>
          <div className="stat-lbl">Skill Gap (no skills)</div>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="card dash-card">
          <h3>🔥 Top Skills</h3>
          {stats.topSkills.length === 0 ? (
            <p className="empty-sm">No skills data yet.</p>
          ) : (
            <div className="skill-bars">
              {stats.topSkills.map((s) => (
                <div key={s.name} className="skill-bar-row">
                  <span className="skill-bar-name">{s.name}</span>
                  <div className="skill-bar-track">
                    <div className="skill-bar-fill" style={{ width: `${(s.count / maxSkillCount) * 100}%` }} />
                  </div>
                  <span className="skill-bar-count">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card dash-card">
          <h3>🏢 Department Distribution</h3>
          {stats.departmentDistribution.length === 0 ? (
            <p className="empty-sm">No department data yet.</p>
          ) : (
            <div className="dept-list">
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
    </div>
  );
}

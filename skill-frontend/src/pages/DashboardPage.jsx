import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import Loader from "../components/Loader";
import Breadcrumb from "../components/common/Breadcrumb";

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

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";

const LEVEL_COLOR = { Beginner: "badge-beginner", Intermediate: "badge-intermediate", Advanced: "badge-advanced" };

export default function EmployeesPage() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminEmployees(token).then((data) => {
      setEmployees(Array.isArray(data) ? data : []);
      setLoading(false);
    });
  }, []);

  const remove = async (id) => {
    if (!confirm("Remove this employee?")) return;
    await api.deleteEmployee(token, id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Employee Management</h2>
        <span className="count-badge">{employees.length} employees</span>
      </div>

      {employees.length === 0 ? (
        <div className="empty">No employees registered yet.</div>
      ) : (
        <div className="employee-list">
          {employees.map((emp) => (
            <div key={emp.id} className="employee-card">
              <div className="emp-header" onClick={() => setExpanded(expanded === emp.id ? null : emp.id)}>
                <div className="emp-avatar">{emp.name?.charAt(0).toUpperCase()}</div>
                <div className="emp-info">
                  <div className="emp-name">{emp.name}</div>
                  <div className="emp-meta">
                    <span>{emp.email}</span>
                    {emp.jobTitle && <><span className="sep">•</span><span>{emp.jobTitle}</span></>}
                    {emp.department && <><span className="sep">•</span><span>{emp.department}</span></>}
                  </div>
                </div>
                <div className="emp-counts">
                  <span>{emp.skills?.length || 0} skills</span>
                  <span>{emp.certifications?.length || 0} certs</span>
                  {emp.yearsOfExperience > 0 && <span>{emp.yearsOfExperience} yrs</span>}
                </div>
                <div className="emp-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn-icon btn-danger" onClick={() => remove(emp.id)}>🗑️</button>
                </div>
                <span className="expand-icon">{expanded === emp.id ? "▲" : "▼"}</span>
              </div>
              {expanded === emp.id && (
                <div className="emp-details">
                  {emp.skills?.length > 0 && (
                    <div className="detail-section">
                      <h4>Skills</h4>
                      <div className="skills-inline">
                        {emp.skills.map((s) => (
                          <span key={s.id} className={`badge ${LEVEL_COLOR[s.proficiency]}`}>
                            {s.name} · {s.proficiency}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {emp.certifications?.length > 0 && (
                    <div className="detail-section">
                      <h4>Certifications</h4>
                      <div className="certs-inline">
                        {emp.certifications.map((c) => (
                          <span key={c.id} className="badge badge-cert">
                            🏆 {c.name}{c.issuer ? ` (${c.issuer})` : ""}{c.year ? ` ${c.year}` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {emp.skills?.length === 0 && emp.certifications?.length === 0 && (
                    <p className="empty-sm">No skills or certifications added.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

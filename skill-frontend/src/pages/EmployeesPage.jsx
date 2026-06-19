import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import ConfirmDialog from "../components/ConfirmDialog";

const LEVEL_COLOR = { Beginner: "badge-beginner", Intermediate: "badge-intermediate", Advanced: "badge-advanced" };

const EMPTY_FILTERS = { skill: "", department: "", minExp: "", certification: "" };

export default function EmployeesPage() {
  const { token } = useAuth();
  const [allEmployees, setAllEmployees] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtered, setFiltered] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  useEffect(() => {
    api.getAdminEmployees(token).then((data) => {
      const list = Array.isArray(data) ? data : [];
      setAllEmployees(list);
      setEmployees(list);
      setLoading(false);
    });
  }, []);

  const remove = async (id) => {
    await api.deleteEmployee(token, id);
    const updated = allEmployees.filter((e) => e.id !== id);
    setAllEmployees(updated);
    setEmployees(updated.filter(applyFilters));
    setDeleteTargetId(null);
  };

  const applyFilters = (emp) => {
    const { skill, department, minExp, certification } = filters;
    if (skill && !emp.skills?.some((s) => s.name.toLowerCase().includes(skill.toLowerCase()))) return false;
    if (department && !emp.department?.toLowerCase().includes(department.toLowerCase())) return false;
    if (minExp && emp.yearsOfExperience < Number(minExp)) return false;
    if (certification && !emp.certifications?.some((c) => c.name.toLowerCase().includes(certification.toLowerCase()))) return false;
    return true;
  };

  const search = (e) => {
    e.preventDefault();
    setEmployees(allEmployees.filter(applyFilters));
    setFiltered(true);
  };

  const reset = () => {
    setFilters(EMPTY_FILTERS);
    setEmployees(allEmployees);
    setFiltered(false);
  };

  const set = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Employee Management</h2>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          {filtered
            ? <span className="count-badge" style={{ color: "var(--primary)" }}>{employees.length} of {allEmployees.length} employees</span>
            : <span className="count-badge">{allEmployees.length} employees</span>
          }
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className= "filter" onClick={() => setShowFilters((v) => !v)}>
           Filters {showFilters ? "▲" : "▼"}
        </button>
      </div>

      {/* ── Slide-down Filter Panel ── */}
      <div style={{
        overflow: "hidden",
        maxHeight: showFilters ? 300 : 0,
        transition: "max-height 0.3s ease",
      }}>
        <div className="card" style={{ padding: "20px 24px" }}>
          <form onSubmit={search}>
            <div className="filter-grid">
              <div className="form-group">
                <label>Skill</label>
                <input name="skill" placeholder="e.g. React, Node.js" value={filters.skill} onChange={set} />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input name="department" placeholder="e.g. Engineering" value={filters.department} onChange={set} />
              </div>
              <div className="form-group">
                <label>Min. Experience (years)</label>
                <input name="minExp" type="number" min="0" placeholder="e.g. 2" value={filters.minExp} onChange={set} />
              </div>
              <div className="form-group">
                <label>Certification</label>
                <input name="certification" placeholder="e.g. AWS Certified" value={filters.certification} onChange={set} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn-primary btn-sm">Apply Filters</button>
              {filtered && <button type="button" className="btn-secondary btn-sm" onClick={reset}>Clear</button>}
            </div>
          </form>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="empty">{filtered ? "No employees match the filters." : "No employees registered yet."}</div>
      ) : (
        <div className="employee-list">
          {employees.map((emp) => (
            <div key={emp.id} className="employee-card">
              <div className="emp-header" onClick={() => setExpanded(expanded === emp.id ? null : emp.id)}>
                <div className="emp-avatar">
                  {emp.avatar
                    ? <img src={emp.avatar} alt={emp.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                    : emp.name?.charAt(0).toUpperCase()
                  }
                </div>
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
                  <button className="btn-icon btn-danger" onClick={() => setDeleteTargetId(emp.id)}>🗑️</button>
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
                      <div className="emp-cert-list">
                        {emp.certifications.map((c) => (
                          <div key={c.id} className="emp-cert-item">
                            <div className="emp-cert-info">
                              <span className="emp-cert-name">🏆 {c.name}</span>
                              <span className="emp-cert-meta">
                                {c.issuer && <span>{c.issuer}</span>}
                                {c.year && <span>📅 {c.year}</span>}
                              </span>
                            </div>
                            {c.fileData && (
                              <button
                                className="emp-file-btn"
                                onClick={() => {
                                  const bytes = Uint8Array.from(atob(c.fileData), (ch) => ch.charCodeAt(0));
                                  const url = URL.createObjectURL(new Blob([bytes], { type: c.fileType }));
                                  window.open(url, "_blank");
                                }}
                              >
                                📄 View Certificate
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {emp.certifications?.length === 0 && (
                    <div className="detail-section">
                      <h4>Certifications</h4>
                      <p className="empty-sm">⚠️ No certifications uploaded yet.</p>
                    </div>
                  )}

                  {emp.resumeData ? (
                    <div className="detail-section">
                      <h4>Resume</h4>
                      <div className="emp-resume-box">
                        <div className="emp-resume-info">
                          <span className="emp-resume-icon">📎</span>
                          <span className="emp-resume-name">{emp.resumeFileName || "Resume"}</span>
                        </div>
                        <button
                          className="emp-file-btn"
                          onClick={() => {
                            const bytes = Uint8Array.from(atob(emp.resumeData), (ch) => ch.charCodeAt(0));
                            const url = URL.createObjectURL(new Blob([bytes], { type: emp.resumeFileType }));
                            window.open(url, "_blank");
                          }}
                        >
                          📄 View Resume
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="detail-section">
                      <h4>Resume</h4>
                      <p className="empty-sm">⚠️ No resume uploaded yet.</p>
                    </div>
                  )}

                  {emp.skills?.length === 0 && emp.certifications?.length === 0 && !emp.resumeData && (
                    <p className="empty-sm">No skills, certifications or resume added.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {deleteTargetId && (
        <ConfirmDialog
          icon="👤"
          title="Remove Employee"
          message="Are you sure you want to remove this employee? This cannot be undone."
          confirmText="Yes, Remove"
          cancelText="Cancel"
          onConfirm={() => remove(deleteTargetId)}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </div>
  );
}

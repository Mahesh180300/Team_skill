import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import Loader from "../components/Loader";
import LoaderDialog from "../components/LoaderDialog";
import { useApi } from "../hooks/useApi";

const LEVEL_COLOR = { Beginner: "badge-beginner", Intermediate: "badge-intermediate", Advanced: "badge-advanced" };
const EMPTY_FILTERS = { skill: "", department: "", minExp: "", certification: "" };
const EMPTY_FORM = { firstName: "", lastName: "", department: "", jobTitle: "", currentProject: "", dateOfJoining: "", dateOfProjectAssigning: "", billable: "no", manager: "" };

function calcDuration(dateStr) {
  if (!dateStr) return "";
  const start = new Date(dateStr);
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (months < 0) return "";
  const yrs = Math.floor(months / 12);
  const mo = months % 12;
  if (yrs === 0) return `${mo}mo`;
  if (mo === 0) return `${yrs}yr`;
  return `${yrs}yr ${mo}mo`;
}

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
  const [editEmp, setEditEmp] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editSaving, setEditSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [filteringEmployees, setFilteringEmployees] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailDialogEmp, setEmailDialogEmp] = useState(null);
  const [emailForm, setEmailForm] = useState({ subject: "", projectName: "", message: "" });
  const [toast, setToast] = useState("");
  const [page, setPage] = useState(1);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const PAGE_SIZE = 4;

  const callDelete = useApi(setDeletingEmployee);
  const callFilter = useApi(setFilteringEmployees);
  const callEdit = useApi(setEditSaving);
  const callEmail = useApi(setSendingEmail);

  useEffect(() => {
    api.getAdminEmployees(token).then((data) => {
      const list = Array.isArray(data) ? data : [];
      setAllEmployees(list);
      setEmployees(list);
      setLoading(false);
    });
    api.getLookupValues("Department").then((v) => setDepartments(Array.isArray(v) ? v : []));
    api.getLookupValues("Job Title").then((v) => setJobTitles(Array.isArray(v) ? v : []));
    api.getLookupValues("Project").then((v) => setProjects(Array.isArray(v) ? v : []));
    api.getLookupValues("Manager").then((v) => setManagers(Array.isArray(v) ? v : []));

    const interval = setInterval(() => {
      api.getAdminEmployees(token).then((data) => {
        const list = Array.isArray(data) ? data : [];
        setAllEmployees(list);
        setEmployees(list);
      }).catch(() => {});
    }, 30000);

    const handler = () => {
      api.getAdminEmployees(token).then((data) => {
        const list = Array.isArray(data) ? data : [];
        setAllEmployees(list);
        setEmployees(list);
      }).catch(() => {});
    };
    window.addEventListener('profile-updated', handler);

    return () => {
      clearInterval(interval);
      window.removeEventListener('profile-updated', handler);
    };
  }, [token]);

  const remove = async (id) => {
    await callDelete(async () => {
      await api.deleteEmployee(token, id);
      const updated = allEmployees.filter((e) => e.id !== id);
      setAllEmployees(updated);
      setEmployees(updated.filter(applyFilters));
      setDeleteTargetId(null);
    });
  };

  const applyFilters = (emp) => {
    const { skill, department, minExp, certification } = filters;
    if (skill && !emp.skills?.some((s) => s.name.toLowerCase().includes(skill.toLowerCase()))) return false;
    if (department && !emp.department?.toLowerCase().includes(department.toLowerCase())) return false;
    if (minExp) {
      const dur = calcDuration(emp.dateOfJoining);
      const yrs = dur ? parseInt(dur) : 0;
      if (yrs < Number(minExp)) return false;
    }
    if (certification && !emp.certifications?.some((c) => c.name.toLowerCase().includes(certification.toLowerCase()))) return false;
    return true;
  };

  const search = async (e) => { e.preventDefault(); setEmployees(allEmployees.filter(applyFilters)); setFiltered(true); setPage(1); };
  const reset = () => { setFilters(EMPTY_FILTERS); setEmployees(allEmployees); setFiltered(false); setPage(1); };
  const setF = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));

  const openEdit = (emp) => {
    setEditEmp(emp);
    setEditForm({
      firstName: emp.firstName || "",
      lastName: emp.lastName || "",
      department: emp.department || "",
      jobTitle: emp.jobTitle || "",
      currentProject: emp.currentProject || "",
      dateOfJoining: emp.dateOfJoining || "",
      dateOfProjectAssigning: emp.dateOfProjectAssigning || "",
      billable: emp.billable || "no",
      manager: emp.manager || "",
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    await callEdit(async () => {
      const updated = await api.updateEmployee(token, editEmp.id, editForm);
      setAllEmployees((prev) => prev.map((e) => e.id === editEmp.id ? { ...e, ...updated } : e));
      setEmployees((prev) => prev.map((e) => e.id === editEmp.id ? { ...e, ...updated } : e));
      setEditEmp(null);
    });
  };

  const openEmailDialog = (emp) => {
    setEmailDialogEmp(emp);
    setEmailForm({
      subject: "Welcome to Your New Project – Onboarding Information",
      projectName: emp.currentProject || "",
      message: `Welcome! You have been onboarded to your assigned project.`,
    });
  };

  const sendOnboardingEmail = async (e) => {
    e.preventDefault();
    await callEmail(async () => {
      const res = await api.sendOnboardingEmail(token, emailDialogEmp.id, emailForm);
      setEmailDialogEmp(null);
      showToast(res.message || "Email sent successfully!");
    });
  };

  if (loading) return <LoaderDialog message="Loading employees..." />;

  return (
    <>
      {filteringEmployees && <LoaderDialog message="Applying filters..." />}
      {deletingEmployee && <LoaderDialog message="Deleting employee..." />}
      {editSaving && <LoaderDialog message="Saving employee..." />}
      {sendingEmail && <LoaderDialog message="Sending onboarding email..." />}
      <div className="page">
      {toast && <div className="toast success">{toast}</div>}
      <div className="page-header">
        <h2>Employee Management</h2>
        {filtered
          ? <span className="count-badge" style={{ color: "var(--primary)" }}>{employees.length} of {allEmployees.length} employees</span>
          : <span className="count-badge">{allEmployees.length} employees</span>
        }
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="filter" onClick={() => setShowFilters((v) => !v)}>
          Filters {showFilters ? "▲" : "▼"}
        </button>
      </div>

      <div style={{ overflow: "hidden", maxHeight: showFilters ? 300 : 0, transition: "max-height 0.3s ease" }}>
        <div className="card" style={{ padding: "20px 24px" }}>
          <form onSubmit={search}>
            <div className="filter-grid">
              <div className="form-group">
                <label>Skill</label>
                <input name="skill" placeholder="e.g. React, Node.js" value={filters.skill} onChange={setF} />
              </div>
              <div className="form-group">
                <label>Department</label>
                <input name="department" placeholder="e.g. Engineering" value={filters.department} onChange={setF} />
              </div>
              <div className="form-group">
                <label>Min. Experience (years)</label>
                <input name="minExp" type="number" min="0" placeholder="e.g. 2" value={filters.minExp} onChange={setF} />
              </div>
              <div className="form-group">
                <label>Certification</label>
                <input name="certification" placeholder="e.g. AWS Certified" value={filters.certification} onChange={setF} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn-primary btn-sm" disabled={filteringEmployees}>
                {filteringEmployees ? "Filtering..." : "Apply Filters"}
              </button>
              {filtered && <button type="button" className="btn-secondary btn-sm" onClick={reset} disabled={filteringEmployees}>Clear</button>}
            </div>
          </form>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="empty">{filtered ? "No employees match the filters." : "No employees registered yet."}</div>
      ) : (
        <div className="employee-list">
          {employees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((emp) => (
            <div key={emp.id} className="employee-card">
              <div className="emp-header" onClick={() => setExpanded(expanded === emp.id ? null : emp.id)}>
                <div className="emp-avatar">
                  {emp.avatar
                    ? <img src={emp.avatar} alt={emp.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                    : (emp.firstName || emp.name)?.charAt(0).toUpperCase()
                  }
                </div>
                <div className="emp-info">
                  <div className="emp-name">{emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : emp.name}</div>
                  <div className="emp-meta">
                    <span>{emp.email}</span>
                    {emp.jobTitle && <><span className="sep">•</span><span>{emp.jobTitle}</span></>}
                    {emp.department && <><span className="sep">•</span><span>{emp.department}</span></>}
                  </div>
                </div>
                <div className="emp-counts">
                  <span>{emp.skills?.length || 0} skills</span>
                  <span>{emp.certifications?.length || 0} certs</span>
                  {emp.dateOfJoining && <span>{calcDuration(emp.dateOfJoining)} exp</span>}
                  {emp.billable === "yes" && <span style={{ color: "#22c55e" }}>Billable</span>}
                </div>
                <div className="emp-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn-icon" onClick={() => openEmailDialog(emp)} title="Send Onboarding Email">📧</button>
                  <button className="btn-icon" onClick={() => openEdit(emp)} title="Edit">✏️</button>
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
                          <span key={s.id} className={`badge ${LEVEL_COLOR[s.proficiency]}`}>{s.name} · {s.proficiency}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {emp.certifications?.length > 0 ? (
                    <div className="detail-section">
                      <h4>Certifications</h4>
                      <div className="emp-cert-list">
                        {emp.certifications.map((c) => (
                          <div key={c.id} className="emp-cert-item">
                            <div className="emp-cert-info">
                              <span className="emp-cert-name">🏆 {c.name}</span>
                              <span className="emp-cert-meta">
                                {c.issuer && <span>{c.issuer}</span>}
                                {c.issuedOn && <span>📅 Issued On: {c.issuedOn}</span>}
                                {c.expiryDate && <span>🗓️ Expires On: {c.expiryDate}</span>}
                              </span>
                            </div>
                            {c.fileData && (
                              <button className="emp-file-btn" onClick={() => { const b = Uint8Array.from(atob(c.fileData), (ch) => ch.charCodeAt(0)); window.open(URL.createObjectURL(new Blob([b], { type: c.fileType })), "_blank"); }}>
                                📄 View Certificate
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="detail-section"><h4>Certifications</h4><p className="empty-sm">⚠️ No certifications uploaded yet.</p></div>
                  )}
                  {emp.resumeData ? (
                    <div className="detail-section">
                      <h4>Resume</h4>
                      <div className="emp-resume-box">
                        <div className="emp-resume-info"><span className="emp-resume-icon">📎</span><span className="emp-resume-name">{emp.resumeFileName || "Resume"}</span></div>
                        <button className="emp-file-btn" onClick={() => { const b = Uint8Array.from(atob(emp.resumeData), (ch) => ch.charCodeAt(0)); window.open(URL.createObjectURL(new Blob([b], { type: emp.resumeFileType })), "_blank"); }}>📄 View Resume</button>
                      </div>
                    </div>
                  ) : (
                    <div className="detail-section"><h4>Resume</h4><p className="empty-sm">⚠️ No resume uploaded yet.</p></div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {employees.length > PAGE_SIZE && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 }}>
          <button className="btn-secondary btn-sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>← Prev</button>
          {Array.from({ length: Math.ceil(employees.length / PAGE_SIZE) }, (_, i) => (
            <button key={i} className={page === i + 1 ? "btn-primary btn-sm" : "btn-secondary btn-sm"} onClick={() => setPage(i + 1)}>{i + 1}</button>
          ))}
          <button className="btn-secondary btn-sm" onClick={() => setPage((p) => p + 1)} disabled={page === Math.ceil(employees.length / PAGE_SIZE)}>Next →</button>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editEmp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }} onClick={() => setEditEmp(null)}>
          <div style={{ background: "var(--card-bg,#fff)", borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "calc(100vh - 32px)", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
            {/* fixed header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 16px", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ margin: 0 }}>Edit Employee</h3>
              <button type="button" onClick={() => setEditEmp(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
            </div>
            {/* scrollable body */}
            <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
              <form id="edit-emp-form" onSubmit={saveEdit}>
                <p style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary)", marginBottom: 10 }}>Personal Info</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                  <div className="form-group">
                    <label>First Name</label>
                    <input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <select value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}>
                      <option value="">Select Department</option>
                      {departments.map((d) => <option key={d.id} value={d.value}>{d.value}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Job Title</label>
                    <select value={editForm.jobTitle} onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}>
                      <option value="">Select Job Title</option>
                      {jobTitles.map((j) => <option key={j.id} value={j.value}>{j.value}</option>)}
                    </select>
                  </div>
                </div>

                <p style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary)", marginBottom: 10 }}>Experience &amp; Project</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 8 }}>
                  <div className="form-group">
                    <label>Date of Joining</label>
                    <input type="date" value={editForm.dateOfJoining} onChange={(e) => setEditForm({ ...editForm, dateOfJoining: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Years of Experience</label>
                    <input value={calcDuration(editForm.dateOfJoining)} readOnly placeholder="Auto-calculated" style={{ background: "var(--bg)", color: "var(--text-muted)", cursor: "not-allowed" }} />
                  </div>
                  <div className="form-group">
                    <label>Current Project</label>
                    <select value={editForm.currentProject} onChange={(e) => setEditForm({ ...editForm, currentProject: e.target.value })}>
                      <option value="">Select Project</option>
                      {projects.map((p) => <option key={p.id} value={p.value}>{p.value}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date of Project Assigning</label>
                    <input type="date" value={editForm.dateOfProjectAssigning} onChange={(e) => setEditForm({ ...editForm, dateOfProjectAssigning: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Relevant Date</label>
                    <input value={calcDuration(editForm.dateOfProjectAssigning)} readOnly placeholder="Auto-calculated" style={{ background: "var(--bg)", color: "var(--text-muted)", cursor: "not-allowed" }} />
                  </div>
                  <div className="form-group">
                    <label>Manager</label>
                    <select value={editForm.manager} onChange={(e) => setEditForm({ ...editForm, manager: e.target.value })}>
                      <option value="">Select Manager</option>
                      {managers.map((m) => <option key={m.id} value={m.value}>{m.value}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Billable</label>
                    <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
                      {["yes", "no"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, billable: opt })}
                          style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `2px solid ${editForm.billable === opt ? "var(--primary)" : "var(--border)"}`, background: editForm.billable === opt ? "var(--primary)" : "var(--card-bg)", color: editForm.billable === opt ? "#fff" : "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.15s" }}
                        >
                          {opt === "yes" ? "✓ Yes" : "✗ No"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            {/* fixed footer */}
            <div style={{ display: "flex", gap: 10, padding: "16px 24px", borderTop: "1px solid var(--border)", justifyContent: "flex-end" }}>
              <button type="button" className="btn-secondary" onClick={() => setEditEmp(null)}>Cancel</button>
              <button type="submit" form="edit-emp-form" className="btn-primary" disabled={editSaving}>{editSaving ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Email Modal */}
      {emailDialogEmp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }} onClick={() => setEmailDialogEmp(null)}>
          <div style={{ background: "var(--card-bg,#fff)", borderRadius: 14, width: "100%", maxWidth: 500, display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 16px", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ margin: 0 }}>📧 Send Onboarding Email</h3>
              <button type="button" onClick={() => setEmailDialogEmp(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--text-muted)" }}>✕</button>
            </div>
            <form id="email-form" onSubmit={sendOnboardingEmail}>
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>Sending to: <strong>{emailDialogEmp.email}</strong></p>
                <div className="form-group">
                  <label>Subject</label>
                  <input value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Project Name</label>
                  <select value={emailForm.projectName} onChange={(e) => setEmailForm({ ...emailForm, projectName: e.target.value })} required>
                    <option value="">Select Project</option>
                    {projects.map((p) => <option key={p.id} value={p.value}>{p.value}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea value={emailForm.message} onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })} rows={6} required style={{ resize: "vertical" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, padding: "16px 24px", borderTop: "1px solid var(--border)", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setEmailDialogEmp(null)}>Cancel</button>
                <button type="submit" form="email-form" className="btn-primary" disabled={sendingEmail}>{sendingEmail ? "Sending..." : "Send Email"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTargetId && (
        <ConfirmDialog
          icon="👤"
          title="Remove Employee"
          message="Are you sure want to remove this employee? This cannot be undone."
          confirmText="Yes, Remove"
          cancelText="Cancel"
          onConfirm={() => remove(deleteTargetId)}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
      </div>
    </>
  );
}

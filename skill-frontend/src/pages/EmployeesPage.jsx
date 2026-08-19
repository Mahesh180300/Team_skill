import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import CertLogo from "../components/common/CertLogo";
import Dropdown from "../components/common/Dropdown";
import Loader from "../components/Loader";
import LoaderDialog from "../components/LoaderDialog";
import { useApi } from "../hooks/useApi";
import InputField from "../components/common/InputField";
import DatePicker from "../components/common/DatePicker";
import DialogBox from "../components/common/DialogBox";
import Button from "../components/common/Button";
import DeleteButton from "../components/common/DeleteButton";
import useDeleteConfirm from "../hooks/useDeleteConfirm";
import Breadcrumb from "../components/common/Breadcrumb";


const LEVEL_COLOR = { Beginner: "badge-beginner", Intermediate: "badge-intermediate", Advanced: "badge-advanced" };
const EMPTY_FILTERS = { skill: "", department: "", minExp: "", certification: "", billable: false, name: "" };
const BILLABLE_OPTIONS = [
  { value: "", label: "All" },
  { value: "yes", label: "Billable" },
  { value: "no", label: "Non-Billable" },
];
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
  const navigate = useNavigate();
  const [allEmployees, setAllEmployees] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtered, setFiltered] = useState(false);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [billableFilter, setBillableFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [showBillableDropdown, setShowBillableDropdown] = useState(false);
  const [billableStatus, setBillableStatus] = useState({});
  const [selectedBillableEmployees, setSelectedBillableEmployees] = useState([]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const downloadResume = (data, fileName, fileType) => {
    const bytes = Uint8Array.from(atob(data), (ch) => ch.charCodeAt(0));
    const blob = new Blob([bytes], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "resume.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
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
      }).catch(() => { });
    }, 30000);

    const handler = () => {
      api.getAdminEmployees(token).then((data) => {
        const list = Array.isArray(data) ? data : [];
        setAllEmployees(list);
        setEmployees(list);
      }).catch(() => { });
    };
    window.addEventListener('profile-updated', handler);

    return () => {
      clearInterval(interval);
      window.removeEventListener('profile-updated', handler);
    };
  }, [token]);

  const { triggerDelete: confirmDelete, DeleteDialog } = useDeleteConfirm({
    onConfirm: async (id) => {
      await callDelete(async () => {
        await api.deleteEmployee(token, id);
        const updated = allEmployees.filter((e) => e.id !== id);
        setAllEmployees(updated);
        showToast("Employee deleted successfully.");
        setEmployees(updated.filter(applyFilters));
      });
    },
    title: "Remove Employee",
    message: "Are you sure want to remove this employee? This cannot be undone.",
    confirmText: "Yes, Remove",
  });

  const applyFilters = (emp) => {
    const { skill, department, minExp, certification, billable } = filters;
    if (skill && !emp.skills?.some((s) => s.name.toLowerCase().includes(skill.toLowerCase()))) return false;
    if (department && !emp.department?.toLowerCase().includes(department.toLowerCase())) return false;
    if (minExp) {
      const dur = calcDuration(emp.dateOfJoining);
      const yrs = dur ? parseInt(dur) : 0;
      if (yrs < Number(minExp)) return false;
    }
    if (certification && !emp.certifications?.some((c) => c.name.toLowerCase().includes(certification.toLowerCase()))) return false;
    if (billable && emp.billable !== "yes") return false;
    return true;
  };

  const applySearchAndBillable = (emp) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : emp.name || "").toLowerCase();
      if (!name.includes(q)) return false;
    }
    if (billableFilter !== "") {
      if ((emp.billable || "no") !== billableFilter) return false;
    }
    return true;
  };

  const displayedEmployees = employees.filter(applySearchAndBillable);
  const hasSearchOrBillable = searchQuery !== "" || billableFilter !== "";

  const [filterError, setFilterError] = useState("");
  const search = async (e) => {
    e.preventDefault();
    const hasAny = filters.skill.trim() || filters.department.trim() || filters.minExp.toString().trim() || filters.certification.trim() || filters.billable;
    if (!hasAny) { setFilterError("Please fill at least one filter field before applying."); return; }
    setFilterError("");
    setEmployees(allEmployees.filter(applyFilters));
    setFiltered(true);
    setPage(1);
  };
  const reset = () => { setFilters(EMPTY_FILTERS); setEmployees(allEmployees); setFiltered(false); setFilterError(""); setPage(1); };
  const resetAll = () => { reset(); setSearchQuery(""); setBillableFilter(""); };
  const setF = (e) => {
    setFilterError("");
    setFilters((f) => ({
      ...f,
      [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  };

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
      showToast("Employee updated successfully.");
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
        <div className="page-header"><h2>Employee Management</h2></div>
        <Breadcrumb action={
          filtered
            ? <span className="count-badge" style={{ color: "#2e2f41" }}>{employees.length} of {allEmployees.length} employees</span>
            : <span className="count-badge">{allEmployees.length} employees</span>
        } />

        <div className="emp-search-filter-bar">
          <div className="emp-search-wrap">
            <span className="emp-search-icon"> <i className="fa-solid fa-magnifying-glass"></i></span>
            <input
              className="emp-search-input"
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            />
            {searchQuery && (
              <Button variant="clear" className="emp-search-clear" onClick={() => { setSearchQuery(""); setPage(1); }} aria-label="Clear search">✕</Button>
            )}
          </div>
          <div className="emp-billable-chips">
            {BILLABLE_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant="chip"
                active={billableFilter === opt.value}
                onClick={() => { setBillableFilter(opt.value); setPage(1); }}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <button className="filter" style={{ marginLeft: "auto" }} onClick={() => setShowFilters((v) => !v)}>
            Filters {showFilters ? "▲" : "▼"}
          </button>
        </div>

        <div style={{ overflow: "hidden", maxHeight: showFilters ? 400 : 0, transition: "max-height 0.3s ease" }}>
          <div className="filter-panel">
            <form onSubmit={search}>
              <div className="filter-panel-grid">
                <div className="form-group">
                  <label className="filter-label">Skill</label>
                  <input name="skill" placeholder="e.g. React, Node.js" value={filters.skill} onChange={setF} />
                </div>
                <div className="form-group">
                  <label className="filter-label">Department</label>
                  <input name="department" placeholder="e.g. Engineering" value={filters.department} onChange={setF} />
                </div>
                <div className="form-group">
                  <label className="filter-label">Min. Experience (yrs)</label>
                  <input name="minExp" type="number" min="0" placeholder="e.g. 2" value={filters.minExp} onChange={setF} />
                </div>
                <div className="form-group">
                  <label className="filter-label">Certification</label>
                  <input name="certification" placeholder="e.g. AWS Certified" value={filters.certification} onChange={setF} />
                </div>
                <div className="form-group">
                  <label className="filter-label">Billable</label>
                  <label className="filter-toggle">
                    <input
                      type="checkbox"
                      name="billable"
                      checked={filters.billable}
                      onChange={setF}
                    />
                    <span className="filter-toggle-track">
                      <span className="filter-toggle-thumb" />
                    </span>
                    <span className="filter-toggle-text">{filters.billable ? "Yes" : "No"}</span>
                  </label>
                </div>
              </div>
              <div className="filter-panel-actions" >
                {filterError && <p className="error" style={{ width: "50%", marginBottom: 0 }}>⚠ {filterError}</p>}
                <Button type="submit" style={{ marginTop: "15px" }} className="btn-primary btn-sm" disabled={filteringEmployees}>
                  {filteringEmployees ? "Filtering..." : "Apply Filters"}
                </Button>
                {filtered && (
                  <button style={{ borderColor: "#2e3041", fontWeight: "bold", fontSize: "13px", marginLeft: "10px" }} type="button" className="btn-secondary btn-sm" onClick={reset} disabled={filteringEmployees}>
                    Clear Filters
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {displayedEmployees.length === 0 ? (
          <div className="empty">{filtered || hasSearchOrBillable ? "No employees match the search or filters." : "No employees registered yet."}</div>
        ) : (
          <>
            <div className="emp-stats-grid">
              <div className="emp-stat-card">

                <span className="emp-stat-val" style={{ color: "#3e74e9" }}>{allEmployees.length}</span>
                <span className="emp-stat-lbl">Total Employees</span>
              </div>
              <div className="emp-stat-card">

                <span className="emp-stat-val" style={{ color: "#22c55e" }}>{allEmployees.filter((e) => e.billable === "yes").length}</span>
                <span className="emp-stat-lbl">Billable</span>
              </div>
              <div className="emp-stat-card">

                <span className="emp-stat-val" style={{ color: "#f59e0b" }}>{allEmployees.filter((e) => e.billable === "no").length}</span>
                <span className="emp-stat-lbl">Non-Billable</span>
              </div>
            </div>

            <div className="employee-list">
              {displayedEmployees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((emp) => (
                <div
                  key={emp.id}
                  className="employee-card"
                  style={{ cursor: "pointer"}}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(46,47,65,0.18)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
                  onClick={() => navigate(`/employees/${emp.id}`, { state: { emp } })}
                >
                  <div className="emp-header">
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
                      {emp.billable === "yes" && <span style={{ color:  "#22c55e"}}>Billable</span>}
                      {emp.billable === "no" && <span style={{ color:"#f59e0b"  }}>Non-Billable</span>}
                    </div>
                     <div className="emp-actions" onClick={(e) => e.stopPropagation()}>
                       <button className="resume-btn resume-btn-icon" onClick={() => openEmailDialog(emp)} title="Send Email">
                         <i style={{ color:"#43a1d8"  }} className="fas fa-envelope"></i>
                       </button>
                       <DeleteButton onClick={() => confirmDelete(emp.id)} />
                     </div>

                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* {displayedEmployees.length > PAGE_SIZE && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 }}>
            <button className="btn-secondary btn-sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>← Prev</button>
            {Array.from({ length: Math.ceil(displayedEmployees.length / PAGE_SIZE) }, (_, i) => (
              <button key={i} className={page === i + 1 ? "btn-primary btn-sm" : "btn-secondary btn-sm"} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="btn-secondary btn-sm" onClick={() => setPage((p) => p + 1)} disabled={page === Math.ceil(displayedEmployees.length / PAGE_SIZE)}>Next →</button>
          </div>
        )} */}

        {/* Onboarding Email Dialog */}
        <DialogBox
          isOpen={!!emailDialogEmp}
          onClose={() => setEmailDialogEmp(null)}
          title="📧 Send Onboarding Email"
          width={500}
          footer={
            <>
              <button type="button" className="btn-secondary" onClick={() => setEmailDialogEmp(null)}>Cancel</button>
              <Button variant="primary" type="submit" form="email-form" loading={sendingEmail}>{sendingEmail ? "Sending..." : "Send Email"}</Button>
            </>
          }
        >
          <form id="email-form" onSubmit={sendOnboardingEmail} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>Sending to: <strong>{emailDialogEmp?.email}</strong></p>
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
          </form>
        </DialogBox>
      {displayedEmployees.length > PAGE_SIZE && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 }}>
          <button className="btn-secondary btn-sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>← Prev</button>
          {Array.from({ length: Math.ceil(displayedEmployees.length / PAGE_SIZE) }, (_, i) => (
            <button key={i} className={page === i + 1 ? "btn-primary btn-sm" : "btn-secondary btn-sm"} onClick={() => setPage(i + 1)}>{i + 1}</button>
          ))}
          <button className="btn-secondary btn-sm" onClick={() => setPage((p) => p + 1)} disabled={page === Math.ceil(displayedEmployees.length / PAGE_SIZE)}>Next →</button>
        </div>
      )}
      
      {/* Onboarding Email Dialog */}
    <DialogBox
        isOpen={!!emailDialogEmp}
        onClose={() => setEmailDialogEmp(null)}
        title="Send Onboarding Email"
        width={500}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEmailDialogEmp(null)}>Cancel</button>
            <Button variant="primary" type="submit" form="email-form" loading={sendingEmail}>{sendingEmail ? "Sending..." : "Send Email"}</Button>
          </>
        }
      >
        <form id="email-form" onSubmit={sendOnboardingEmail} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>Sending to: <strong>{emailDialogEmp?.email}</strong></p>
          <div className="form-group">
            <label>Subject</label>
            <input value={emailForm.subject} onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Project Name</label>
            <Dropdown
              value={emailForm.projectName}
              onChange={(e) => setEmailForm({ ...emailForm, projectName: e.target.value })}
              options={projects.map((p) => ({ value: p.value, label: p.value }))}
              placeholder="--Select Project--"
              required
            />
          </div>
          <div className="form-group">
            <label>Message</label>
            <textarea value={emailForm.message} onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })} rows={6} required style={{ resize: "vertical" }} />
          </div>
        </form>
      </DialogBox>

        {DeleteDialog}
      </div>
    </>
  );
}
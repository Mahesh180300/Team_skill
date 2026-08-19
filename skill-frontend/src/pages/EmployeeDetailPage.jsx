import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import CertLogo from "../components/common/CertLogo";
import EmployeeProfileCard from "../components/common/EmployeeProfileCard";
import LoaderDialog from "../components/LoaderDialog";
import Button from "../components/common/Button";
import Breadcrumb from "../components/common/Breadcrumb";
import DialogBox from "../components/common/DialogBox";
import Dropdown from "../components/common/Dropdown";
import { useApi } from "../hooks/useApi";

const LEVEL_COLOR = { Beginner: "badge-beginner", Intermediate: "badge-intermediate", Advanced: "badge-advanced" };

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

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [emp, setEmp] = useState(location.state?.emp || null);
  const [loading, setLoading] = useState(!location.state?.emp);

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailDialogEmp, setEmailDialogEmp] = useState(null);
  const [emailForm, setEmailForm] = useState({ subject: "", projectName: "", message: "" });
  const [projects, setProjects] = useState([]);
  const [toast, setToast] = useState("");
  const callEmail = useApi(setSendingEmail);
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

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

  useEffect(() => {
    api.getLookupValues("Project").then((v) => setProjects(Array.isArray(v) ? v : []));
  }, []);

  useEffect(() => {
    if (location.state?.emp) return;
    api.getAdminEmployees(token).then((data) => {
      const list = Array.isArray(data) ? data : [];
      const found = list.find((e) => String(e.id) === String(id));
      setEmp(found || null);
      setLoading(false);
    });
  }, [id, token]);

  const downloadResume = (emp) => {
    const a = document.createElement("a");
    if (emp.resumeUrl) {
      // Cloudinary URL — force download via fl_attachment
      a.href = emp.resumeUrl.replace("/upload/", "/upload/fl_attachment/");
    } else {
      const bytes = Uint8Array.from(atob(emp.resumeData), (ch) => ch.charCodeAt(0));
      a.href = URL.createObjectURL(new Blob([bytes], { type: emp.resumeFileType }));
    }
    a.download = emp.resumeFileName || "resume.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (loading) return <LoaderDialog message="Loading employee..." />;
  if (!emp) return <div className="empty">Employee not found.</div>;

  const getCertStatus = (expiryDate) => {
    if (!expiryDate) return { label: "Active", cls: "cert-status-valid" };
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: "Expired", cls: "cert-status-expired" };
    if (diffDays <= 90) return { label: "Expiring Soon", cls: "cert-status-expiring" };
    return { label: "Active", cls: "cert-status-valid" };
  };
  const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : null;

  return (
    <div className="page">
      {sendingEmail && <LoaderDialog message="Sending onboarding email..." />}
      {toast && <div className="toast success">{toast}</div>}

      <div className="page-header">
        <h2>{emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : emp.name}</h2>
      </div>
      <Breadcrumb action={<Button variant="primary" onClick={() => navigate(-1)}>Go Back</Button>} />

      <div className="employee-card" style={{ padding: "20px" }}>
        
  
        <EmployeeProfileCard emp={emp} onEmailClick={() => openEmailDialog(emp)} />


        <div className="emp-details" style={{paddingTop: 16 ,marginTop: 16}}>

          
            <div className="detail-section">
              <h4>CURRENT PROJECT</h4>
              <div className="skills-inline" >
                {emp.currentProject ? (
                  <span className="badge badge-project" style={{ backgroundColor: "#e8e8f8", color: "#3b406f" }}>
                    {emp.currentProject}
                  </span>
                ) : (
                  <p className="empty-sm">⚠️ No current project assigned.</p>
                )}
              </div>
            </div>
             
          
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
              <div className="certs-list">
                {emp.certifications.map((c) => {
                  const status = getCertStatus(c.expiryDate);
                  return (
                    <div key={c.id} className="modern-cert-card">
                      <div className="modern-cert-icon"><CertLogo name={c.name} size={42} /></div>
                      <div className="modern-cert-content">
                        <span className={`cert-status-badge ${status.cls}`}>{status.label}</span>
                        <div className="cert-card-top"><h3 className="cert-card-name">{c.name}</h3></div>
                        {c.issuer && (
                          <div className="cert-meta-row">
                            <span>Issued by: <strong style={{ color: "#383da7" }}>{c.issuer}</strong></span>
                          </div>
                        )}
                        <div className="cert-meta-dates">
                          {c.issuedOn && (
                            <div className="cert-meta-row">
                              <i className="fas fa-calendar-alt cert-meta-icon"></i>
                              <span>Issued: {formatDate(c.issuedOn)}</span>
                            </div>
                          )}
                          {c.expiryDate && (
                            <div className="cert-meta-row">
                              <i className="fas fa-calendar-times cert-meta-icon"></i>
                              <span>Expires: {formatDate(c.expiryDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {(c.fileUrl || c.fileData) && (
                        <button className="certificate-box" onClick={() => {
                          if (c.fileUrl) { window.open(c.fileUrl, "_blank"); }
                          else { const b = Uint8Array.from(atob(c.fileData), (ch) => ch.charCodeAt(0)); window.open(URL.createObjectURL(new Blob([b], { type: c.fileType })), "_blank"); }
                        }}>
                          <div>View Certificate ↗</div>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="detail-section"><h4>Certifications</h4><p className="empty-sm">⚠️ No certifications uploaded yet.</p></div>
          )}

          {(emp.resumeUrl || emp.resumeData) ? (
            <div className="detail-section">
              <h4>Resume</h4>
              <div className="emp-resume-box">
                <div className="emp-resume-info">
                  <span className="emp-resume-icon"><i className="fas fa-file-alt" style={{ color: "#6366f1", fontSize: 24 }}></i></span>
                  <div>
                    <div className="emp-resume-name">{emp.resumeFileName || "Resume"}</div>
                    {emp.updatedAt && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Last updated: {new Date(emp.updatedAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</div>}
                  </div>
                </div>
                <div className="emp-resume-actions">
                  <button className="emp-file-btn" onClick={() => downloadResume(emp)}>Download Resume ↗</button>
                  {emp.resumeUrl
                    ? <button className="emp-file-btn" onClick={() => window.open(emp.resumeUrl, "_blank")}>View Resume ↗</button>
                    : <button className="emp-file-btn" onClick={() => { const b = Uint8Array.from(atob(emp.resumeData), (ch) => ch.charCodeAt(0)); window.open(URL.createObjectURL(new Blob([b], { type: emp.resumeFileType })), "_blank"); }}>View Resume ↗</button>
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="detail-section"><h4>Resume</h4><p className="empty-sm">⚠️ No resume uploaded yet.</p></div>
          )}
        </div>
      </div>

      {/* Onboarding Email Dialog */}
      <DialogBox
        isOpen={!!emailDialogEmp}
        onClose={() => setEmailDialogEmp(null)}
        title="📧 Send Onboarding Email"
        width={500}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEmailDialogEmp(null)}>Cancel</button>
            <Button variant="primary" type="submit" form="email-form-detail" loading={sendingEmail}>{sendingEmail ? "Sending..." : "Send Email"}</Button>
          </>
        }
      >
        <form id="email-form-detail" onSubmit={sendOnboardingEmail} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
    </div>
  );
}

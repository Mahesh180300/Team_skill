import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import Loader from "../components/Loader";
import LoaderDialog from "../components/LoaderDialog";
import { useApi } from "../hooks/useApi";

export default function ProfilePage({ onNavigate }) {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");
  const [departments, setDepartments] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [viewAvatar, setViewAvatar] = useState(false);
  const [showDeleteResume, setShowDeleteResume] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);

  const callSave = useApi(setSavingProfile);
  const callAvatar = useApi(setUploadingAvatar);
  const callDeleteAvatar = useApi(setDeletingAvatar);
  const callResume = useApi(setResumeUploading);
  const callDeleteResume = useApi(setDeletingResume);

  const showToast = (text) => { setMsg(text); setTimeout(() => setMsg(""), 2500); };

  useEffect(() => {
    setLoadingProfile(true);
    api.getProfile(token).then((data) => {
      setProfile(data);
      setForm({ firstName: data.firstName || '', lastName: data.lastName || '', department: data.department, jobTitle: data.jobTitle, currentProject: data.currentProject || '', dateOfJoining: data.dateOfJoining || '', dateOfProjectAssigning: data.dateOfProjectAssigning || '', billable: data.billable || 'no', manager: data.manager || '' });
      setLoadingProfile(false);
    });
    api.getLookupValues('Department').then((v) => setDepartments(Array.isArray(v) ? v : []));
    api.getLookupValues('Job Title').then((v) => setJobTitles(Array.isArray(v) ? v : []));
    api.getLookupValues('Project').then((v) => setProjects(Array.isArray(v) ? v : []));
    api.getLookupValues('Manager').then((v) => setManagers(Array.isArray(v) ? v : []));
  }, []);

  const calcDuration = (dateStr) => {
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
  };

  const save = async (e) => {
    e.preventDefault();
    await callSave(async () => {
      const updated = await api.updateProfile(token, form);
      setProfile(updated);
      setEditing(false);
      showToast("Profile updated");
    });
  };
  

  const uploadResume = async (file) => {
    if (!file) return;
    await callResume(async () => {
      const data = await api.uploadResume(token, file);
      if (data.resumeData) {
        setProfile((p) => ({ ...p, resumeData: data.resumeData, resumeFileName: data.resumeFileName, resumeFileType: data.resumeFileType }));
        showToast("Resume uploaded");
      }
    });
  };

  const deleteResume = async () => {
    await callDeleteResume(async () => {
      await api.deleteResume(token);
      setProfile((p) => ({ ...p, resumeData: '', resumeFileName: '', resumeFileType: '' }));
      setShowDeleteResume(false);
      showToast("Resume deleted!");
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await callAvatar(async () => {
      const updated = await api.uploadAvatar(token, file);
      setProfile(updated);
      showToast("Profile picture updated");
    });
  };

  const handleDeleteAvatar = async () => {
    await callDeleteAvatar(async () => {
      const updated = await api.deleteAvatar(token);
      setProfile(updated);
      setViewAvatar(false);
      showToast("Profile picture removed");
    });
  };

  const calcCompletion = (p) => {
    const fields = [
      { label: "Profile Picture", done: !!p.avatar },
      { label: "Skills", done: p.skills?.length > 0 },
      { label: "Certifications", done: p.certifications?.length > 0 },
      { label: "Resume", done: !!p.resumeData },
    ];
    const percent = Math.round((fields.filter((f) => f.done).length / fields.length) * 100);
    const missing = fields.filter((f) => !f.done).map((f) => f.label);
    return { percent, missing };
  };

  if (loadingProfile) return <Loader message="Loading profile..." />;

  return (
    <div className="page">
      <div className="page-header">
        <h2>My Profile</h2>
        <button className="btn-secondary" onClick={() => setEditing(true)} style={{  backgroundColor: "var(--primary)", color: "white" }}>
          Edit Profile
        </button>
      </div>
      {msg && <div className="toast success">{msg}</div>}

      {editing && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "16px" }}
          onClick={() => setEditing(false)}
        >
          <div
            style={{ background: "var(--card-bg,#fff)", borderRadius: 14, width: "100%", maxWidth: 560, maxHeight: "calc(100vh - 32px)", display: "flex", flexDirection: "column", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* fixed header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 16px", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ margin: 0 }}>Edit Profile</h3>
              <button type="button" onClick={() => setEditing(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", lineHeight: 1, color: "var(--text-muted)" }}>✕</button>
            </div>
            {/* scrollable body */}
            <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
              <form id="edit-profile-form" onSubmit={save}>
                <p style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary)", marginBottom: 10 }}>Personal Info</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 20 }}>
                  <div className="form-group">
                    <label>First Name</label>
                    <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                      <option value="">Select Department</option>
                      {departments.map((d) => <option key={d.id} value={d.value}>{d.value}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Job Title</label>
                    <select value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}>
                      <option value="">Select Job Title</option>
                      {jobTitles.map((j) => <option key={j.id} value={j.value}>{j.value}</option>)}
                    </select>
                  </div>
                </div>

                <p style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary)", marginBottom: 10 }}>Experience &amp; Project</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, marginBottom: 8 }}>
                  <div className="form-group">
                    <label>Date of Joining</label>
                    <input type="date" value={form.dateOfJoining} onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Years of Experience</label>
                    <input value={calcDuration(form.dateOfJoining)} readOnly placeholder="Auto-calculated" style={{ background: "var(--bg)", color: "var(--text-muted)", cursor: "not-allowed" }} />
                  </div>
                  <div className="form-group">
                    <label>Current Project</label>
                    <select value={form.currentProject} onChange={(e) => setForm({ ...form, currentProject: e.target.value })}>
                      <option value="">Select Project</option>
                      {projects.map((p) => <option key={p.id} value={p.value}>{p.value}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date of Project Assigning</label>
                    <input type="date" value={form.dateOfProjectAssigning} onChange={(e) => setForm({ ...form, dateOfProjectAssigning: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Relevant Date</label>
                    <input value={calcDuration(form.dateOfProjectAssigning)} readOnly placeholder="Auto-calculated" style={{ background: "var(--bg)", color: "var(--text-muted)", cursor: "not-allowed" }} />
                  </div>
                  <div className="form-group">
                    <label>Manager</label>
                    <select value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })}>
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
                          onClick={() => setForm({ ...form, billable: opt })}
                          style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `2px solid ${form.billable === opt ? "var(--primary)" : "var(--border)"}`, background: form.billable === opt ? "var(--primary)" : "var(--card-bg)", color: form.billable === opt ? "#fff" : "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.15s" }}
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
              <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" form="edit-profile-form" className="btn-primary" disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
            </div>
          </div>
        </div>
      )}

      <div className="card profile-card">
          {/* Avatar area */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div className="avatar-upload-wrapper">
              <div
                className="profile-avatar"
                onClick={() => profile.avatar && setViewAvatar(true)}
                style={{ cursor: profile.avatar ? "pointer" : "default" }}
                title={profile.avatar ? "View profile picture" : undefined}
              >
                {profile.avatar
                  ? <img src={profile.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                  : profile.name?.charAt(0).toUpperCase()
                }
              </div>
              <button
                className="avatar-edit-btn"
                onClick={() => document.getElementById("avatar-input").click()}
                title="Change profile picture"
              >
                ✏️
              </button>
              <input id="avatar-input" type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
            </div>
          </div>

          <div className="profile-details">
            <h3>{profile.firstName || profile.name} {profile.firstName ? profile.lastName : ''}</h3>
            <p className="profile-email">{profile.email}</p>
            <div className="profile-meta">
              {profile.jobTitle && <span className="badge">{profile.jobTitle}</span>}
              {profile.department && <span className="badge badge-dept">{profile.department}</span>}
              {profile.dateOfJoining && <span className="badge badge-exp">{calcDuration(profile.dateOfJoining)} exp</span>}
              {profile.currentProject && <span className="badge">{profile.currentProject}</span>}
              {profile.billable === 'yes' && <span className="badge" style={{ background: '#22c55e', color: '#fff' }}>Billable</span>}
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat" onClick={() => onNavigate("skills")} style={{ cursor: "pointer" }}><span className="stat-val">{profile.skills?.length || 0}</span><span className="stat-lbl">Skills</span></div>
            <div className="stat" onClick={() => onNavigate("certs")} style={{ cursor: "pointer" }}><span className="stat-val">{profile.certifications?.length || 0}</span><span className="stat-lbl">Certs</span></div>
          </div>

          <div className="profile-completion">
            {(() => {
              const { percent, missing } = calcCompletion(profile);
              return (
                <>
                  <div className="completion-header">
                    <span>Profile Completion</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="completion-track">
                    <div className="completion-fill" style={{ width: `${percent}%`, backgroundColor: percent === 100 ? "#22c55e" : percent >= 50 ? "#f59e0b" : "#ef4444" }} />
                  </div>
                  {missing.length > 0 && (
                    <div className="completion-missing">
                    <small>Missing:</small>
{missing.map((m) => (
  <span key={m} className="missing-tag">
    {m}
  </span>
))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

      <div className="card resume-section-card">
        <input id="resume-input" type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) uploadResume(e.target.files[0]); e.target.value = ""; }} />
        <div className="resume-section-header">
          <div className="resume-section-title">
            <div className="resume-section-icon-wrap">📄</div>
            <div>
              <h3>Resume</h3>
              <p>Your professional resume for recruiters &amp; managers</p>
            </div>
          </div>
        </div>

        {profile.resumeData ? (
          <div className="resume-file-card">
            <div className="resume-file-thumb">📎</div>
            <div className="resume-file-meta">
              <span className="resume-file-name" style={{ textDecoration: "underline" }}>
                {profile.resumeFileName}
              </span>
            </div>
            <div className="resume-file-actions">
              <button
                className="resume-btn resume-btn-view"
                onClick={() => {
                  const bytes = Uint8Array.from(atob(profile.resumeData), (ch) => ch.charCodeAt(0));
                  const url = URL.createObjectURL(new Blob([bytes], { type: profile.resumeFileType }));
                  window.open(url, "_blank");
                }}
              >View Resume ↗</button>
              <button className="resume-btn resume-btn-edit" onClick={() => document.getElementById("resume-input").click()} disabled={resumeUploading}>Edit</button>
              <button className="resume-btn resume-btn-delete" onClick={() => setShowDeleteResume(true)} disabled={resumeUploading}>Delete</button>
            </div>
          </div>
        ) : (
          <div className="resume-empty-state">
            <div className="resume-empty-illustration">📎</div>
            <div>
              <p className="resume-empty-title">No resume uploaded yet</p>
              <p className="resume-empty-sub">PDF, DOC or DOCX supported</p>
            </div>
            <button className="resume-btn resume-btn-upload-main" onClick={() => document.getElementById("resume-input").click()} disabled={resumeUploading}>
              {resumeUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        )}
      </div>

      {showDeleteResume && (
        <ConfirmDialog
          icon="🗑️"
          title="Delete Resume"
          message="Are you sure you want to delete your resume? This cannot be undone."
          confirmText="Yes, Delete"
          cancelText="Cancel"
          onConfirm={deleteResume}
          onCancel={() => setShowDeleteResume(false)}
        />
      )}

      {/* Avatar view modal */}
      {viewAvatar && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 }}
          onClick={() => setViewAvatar(false)}
        >
          <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
            <img src={profile.avatar} alt="Profile" style={{ maxWidth: "90vw", maxHeight: "80vh", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }} />
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 14 }}>
              <button className="btn-secondary" onClick={() => setViewAvatar(false)} disabled={deletingAvatar}>Close</button>
              <button
                className="btn-primary"
                style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
                onClick={handleDeleteAvatar}
                disabled={deletingAvatar}
              >
                {deletingAvatar ? "Deleting..." : "Delete Photo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {savingProfile && <LoaderDialog message="Saving profile..." />}
      {uploadingAvatar && <LoaderDialog message="Uploading profile picture..." />}
      {deletingAvatar && <LoaderDialog message="Deleting profile picture..." />}
      {resumeUploading && <LoaderDialog message="Uploading resume..." />}
      {deletingResume && <LoaderDialog message="Deleting resume..." />}
    </div>
  );
}

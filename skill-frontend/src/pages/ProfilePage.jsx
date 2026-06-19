import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import ConfirmDialog from "../components/ConfirmDialog";

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");
  const [resumeUploading, setResumeUploading] = useState(false);
  const [viewAvatar, setViewAvatar] = useState(false);
  const [showDeleteResume, setShowDeleteResume] = useState(false);

  const showToast = (text) => { setMsg(text); setTimeout(() => setMsg(""), 2500); };

  useEffect(() => {
    api.getProfile(token).then((data) => {
      setProfile(data);
      setForm({ name: data.name, department: data.department, jobTitle: data.jobTitle, yearsOfExperience: data.yearsOfExperience });
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    const updated = await api.updateProfile(token, { ...form, yearsOfExperience: Number(form.yearsOfExperience) });
    setProfile(updated);
    setEditing(false);
    showToast("Profile updated");
  };
  

  const uploadResume = async (file) => {
    if (!file) return;
    setResumeUploading(true);
    const data = await api.uploadResume(token, file);
    if (data.resumeUrl) {
      setProfile((p) => ({ ...p, resumeUrl: data.resumeUrl, resumeOriginalName: data.resumeOriginalName }));
      showToast("Resume uploaded");
    }
    setResumeUploading(false);
  };

  const deleteResume = async () => {
    await api.deleteResume(token);
    setProfile((p) => ({ ...p, resumeUrl: "", resumeOriginalName: "" }));
    setShowDeleteResume(false);
    showToast("Resume deleted!");
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const updated = await api.uploadAvatar(token, file);
    setProfile(updated);
    showToast("Profile picture updated");
  };

  const handleDeleteAvatar = async () => {
    const updated = await api.deleteAvatar(token);
    setProfile(updated);
    setViewAvatar(false);
    showToast("Profile picture removed");
  };

  const calcCompletion = (p) => {
    const fields = [
      { label: "Profile Picture", done: !!p.avatar },
      { label: "Skills", done: p.skills?.length > 0 },
      { label: "Certifications", done: p.certifications?.length > 0 },
      { label: "Resume", done: !!p.resumeUrl },
    ];
    const percent = Math.round((fields.filter((f) => f.done).length / fields.length) * 100);
    const missing = fields.filter((f) => !f.done).map((f) => f.label);
    return { percent, missing };
  };

  if (!profile) return <div className="loading">Loading...</div>;

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
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000}}
          onClick={() => setEditing(false)}
        >
          <div style={{ background: "var(--card-bg, #fff)", borderRadius: 12, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 8px 40px rgba(0,0,0,0.2)"}} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Edit Profile</h3>
              <button type="button" onClick={() => setEditing(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>✕</button>
            </div>
            <form onSubmit={save}>
              <div className="form-grid" style={{ border: "1px solid var(--border-color, #ccc)", borderRadius: 8, padding: 16, gap: 16 }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Engineering" />
                </div>
                <div className="form-group">
                  <label>Job Title</label>
                  <input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="e.g. Frontend Developer" />
                </div>
                <div className="form-group">
                  <label>Years of Experience</label>
                  <input type="number" min="0" value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
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
            <h3>{profile.name}</h3>
            <p className="profile-email">{profile.email}</p>
            <div className="profile-meta">
              {profile.jobTitle && <span className="badge">{profile.jobTitle}</span>}
              {profile.department && <span className="badge badge-dept">{profile.department}</span>}
              {profile.yearsOfExperience > 0 && <span className="badge badge-exp">{profile.yearsOfExperience} yrs exp</span>}
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat"><span className="stat-val">{profile.skills?.length || 0}</span><span className="stat-lbl">Skills</span></div>
            <div className="stat"><span className="stat-val">{profile.certifications?.length || 0}</span><span className="stat-lbl">Certs</span></div>
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
                      {missing.map((m) => <span key={m} className="missing-tag">{m}</span>)}
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

        {profile.resumeUrl ? (
          <div className="resume-file-card">
            <div className="resume-file-thumb">📎</div>
            <div className="resume-file-meta">
              <span className="resume-file-name" style={{ textDecoration: "underline" }}>
                {profile.resumeOriginalName || profile.resumeUrl.split("/").pop()}
              </span>
            </div>
            <div className="resume-file-actions">
              <a href={`http://localhost:5009${profile.resumeUrl}`} target="_blank" rel="noreferrer" className="resume-btn resume-btn-view">View Resume ↗</a>
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
              <button className="btn-secondary" onClick={() => setViewAvatar(false)}>Close</button>
              <button
                className="btn-primary"
                style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
                onClick={handleDeleteAvatar}
              >
                Delete Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

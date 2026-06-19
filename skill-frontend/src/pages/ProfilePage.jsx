import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [viewAvatar, setViewAvatar] = useState(false);

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
    showToast("Profile updated!");
  };
  

  const uploadResume = async () => {
    if (!resumeFile) return;
    setResumeUploading(true);
    const data = await api.uploadResume(token, resumeFile);
    if (data.resumeUrl) {
      setProfile((p) => ({ ...p, resumeUrl: data.resumeUrl, resumeOriginalName: data.resumeOriginalName }));
      setMsg("Resume uploaded!");
      setTimeout(() => setMsg(""), 2000);
    }
    setResumeFile(null);
    setResumeUploading(false);
  };

  const deleteResume = async () => {
    await api.deleteResume(token);
    setProfile((p) => ({ ...p, resumeUrl: "", resumeOriginalName: "" }));
    setMsg("Resume deleted!");
    setTimeout(() => setMsg(""), 2000);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const updated = await api.uploadAvatar(token, file);
    setProfile(updated);
    showToast("Profile picture updated!");
  };

  const handleDeleteAvatar = async () => {
    const updated = await api.deleteAvatar(token);
    setProfile(updated);
    setViewAvatar(false);
    showToast("Profile picture removed!");
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
        {!editing && <button className="btn-secondary" onClick={() => setEditing(true)}>Edit Profile</button>}
      </div>
      {msg && <div className="toast success">{msg}</div>}

      {editing ? (
        <form onSubmit={save} className="card form-card">
          <div className="form-grid">
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
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
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
      )}

      <div className="card resume-card">
        <div className="resume-card-header">
          <span className="resume-card-icon">📄</span>
          <div>
            <h3>Resume</h3>
            <small>Upload your latest resume for visibility</small>
          </div>
          {profile.resumeUrl && <span className="resume-status-badge">✅ Uploaded</span>}
        </div>

        {profile.resumeUrl ? (
          <div className="resume-uploaded-box">
            <div className="resume-file-info">
              <span className="resume-file-icon">📎</span>
              <div>
                <p className="resume-file-name">{profile.resumeOriginalName || profile.resumeUrl.split("/").pop()}</p>
                <small className="resume-file-sub">Uploaded successfully</small>
              </div>
            </div>
            <div className="resume-actions">
              <a href={`http://localhost:5009${profile.resumeUrl}`} target="_blank" rel="noreferrer" className="btn-view-resume"> View </a>
              <button className="btn-delete-resume" onClick={deleteResume} title="Delete resume">🗑 Delete</button>
            </div>
          </div>
        ) : (
          <div className="resume-empty-box">
            <span className="resume-empty-icon">📭</span>
            <p>No resume uploaded yet</p>
          </div>
        )}

        <div className="resume-upload-zone">
          <label className="resume-upload-label">
            <span>🗂 {resumeFile ? resumeFile.name : "Choose a file (PDF, DOC, DOCX)"}</span>
            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files[0])} hidden />
          </label>
          {resumeFile && (
            <button className="btn-primary btn-sm" onClick={uploadResume} disabled={resumeUploading}>
              {resumeUploading ? "⏳ Uploading..." : "⬆ Upload Resume"}
            </button>
          )}
        </div>
      </div>

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

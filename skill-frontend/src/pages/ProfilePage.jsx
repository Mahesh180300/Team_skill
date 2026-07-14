import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import Loader from "../components/Loader";
import LoaderDialog from "../components/LoaderDialog";
import { useApi } from "../hooks/useApi";
import { ROUTES } from "../router/routes";
import SearchableSelect from "../components/SearchableSelect";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, setProfile: setSharedProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");
  const [departments, setDepartments] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);
  const [showDeleteResume, setShowDeleteResume] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const callSave = useApi(setSavingProfile);
  const callResume = useApi(setResumeUploading);
  const callDeleteResume = useApi(setDeletingResume);
  // const callAvatar = useApi(setUploadingAvatar);
  // const callDeleteAvatar = useApi(setDeletingAvatar);

  const showToast = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 2500);
  };

  useEffect(() => {
    setLoadingProfile(true);
    api.getProfile(token).then((data) => {
      setProfile(data);
      setForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        department: data.department,
        jobTitle: data.jobTitle,
        currentProject: data.currentProject || "",
        dateOfJoining: data.dateOfJoining || "",
        dateOfProjectAssigning: data.dateOfProjectAssigning || "",
        billable: data.billable || "no",
        manager: data.manager || "",
      });
      setLoadingProfile(false);
    });
    api
      .getLookupValues("Department")
      .then((v) => setDepartments(Array.isArray(v) ? v : []));
    api
      .getLookupValues("Job Title")
      .then((v) => setJobTitles(Array.isArray(v) ? v : []));
    api
      .getLookupValues("Project")
      .then((v) => setProjects(Array.isArray(v) ? v : []));
    api
      .getLookupValues("Manager")
      .then((v) => setManagers(Array.isArray(v) ? v : []));
  }, []);

  const calcDuration = (dateStr) => {
    if (!dateStr) return "";
    const start = new Date(dateStr);
    const now = new Date();
    let months =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());
    if (months < 0) return "";
    const yrs = Math.floor(months / 12);
    const mo = months % 12;
    if (yrs === 0) return `${mo} month`;
    if (mo === 0) return `${yrs} year`;
    return `${yrs} year ${mo} month`;
  };

  const save = async (e) => {
    e.preventDefault();
    await callSave(async () => {
      const updated = await api.updateProfile(token, form);
      setProfile(updated);
      setSharedProfile(updated);
      setEditing(false);
      showToast("Profile updated");
    });
  };

  const uploadResume = async (file) => {
    if (!file) return;
    await callResume(async () => {
      const data = await api.uploadResume(token, file);
      if (data.resumeData) {
        setProfile((p) => ({
          ...p,
          resumeData: data.resumeData,
          resumeFileName: data.resumeFileName,
          resumeFileType: data.resumeFileType,
        }));
        setSharedProfile((p) => ({
          ...p,
          resumeData: data.resumeData,
          resumeFileName: data.resumeFileName,
          resumeFileType: data.resumeFileType,
        }));
        showToast("Resume uploaded");
      }
    });
  };

  const deleteResume = async () => {
    await callDeleteResume(async () => {
      await api.deleteResume(token);
      setProfile((p) => ({
        ...p,
        resumeData: "",
        resumeFileName: "",
        resumeFileType: "",
      }));
      setSharedProfile((p) => ({
        ...p,
        resumeData: "",
        resumeFileName: "",
        resumeFileType: "",
      }));
      setShowDeleteResume(false);
      showToast("Resume deleted!");
    });
  };

  const calcCompletion = (p) => {
    const fields = [
      { label: "Profile Picture", done: !!p.avatar },
      { label: "Skills", done: p.skills?.length > 0 },
      { label: "Certifications", done: p.certifications?.length > 0 },
      { label: "Resume", done: !!p.resumeData },
    ];
    const percent = Math.round(
      (fields.filter((f) => f.done).length / fields.length) * 100,
    );
    const missing = fields.filter((f) => !f.done).map((f) => f.label);
    return { percent, missing };
  };

  if (loadingProfile) return <Loader message="Loading profile..." />;

  return (
    <div className="page">
      <div className="page-header">
        <h2>My Profile</h2>
        <button
          className="btn-secondary"
          onClick={() => setEditing(true)}
          style={{ backgroundColor: "var(--primary)", color: "white" }}
        >
          Edit Profile
        </button>
      </div>
      {msg && <div className="toast success">{msg}</div>}

      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "16px",
          }}
          onClick={() => setEditing(false)}
        >
          <div
            style={{
              background: "var(--card-bg,#fff)",
              borderRadius: 14,
              width: "100%",
              maxWidth: "640px",
              maxHeight: "calc(100vh - 32px)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 8px 40px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* fixed header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px 16px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <h3 style={{ margin: 0 }}>Edit Profile</h3>
              <button
                type="button"
                onClick={() => setEditing(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  cursor: "pointer",
                  lineHeight: 1,
                  color: "var(--text-muted)",
                }}
              >
                ✕
              </button>
            </div>
            {/* scrollable body */}
            <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px" }}>
              <form id="edit-profile-form" onSubmit={save}>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "gray",
                    marginBottom: 10,
                  }}
                >
                  Personal Info
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 20,
                  }}
                >
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      value={form.firstName}
                      onChange={(e) =>
                        setForm({ ...form, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      value={form.lastName}
                      onChange={(e) =>
                        setForm({ ...form, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <SearchableSelect
                      value={form.department}
                      onChange={(val) => setForm({ ...form, department: val })}
                      options={departments}
                      placeholder="Select Department"
                    />
                  </div>
                  <div className="form-group">
                    <label>Job Title</label>
                    <SearchableSelect
                      value={form.jobTitle}
                      onChange={(val) => setForm({ ...form, jobTitle: val })}
                      options={jobTitles}
                      placeholder="Select Job Title"
                    />
                  </div>
                </div>

                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "gray",
                    marginBottom: 10,
                  }}
                >
                  Experience &amp; Project
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 8,
                  }}
                >
                  <div className="form-group">
                    <label>Date of Joining</label>
                    <input
                      type="date"
                      value={form.dateOfJoining}
                      onChange={(e) =>
                        setForm({ ...form, dateOfJoining: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Years of Experience</label>
                    <input
                      value={calcDuration(form.dateOfJoining)}
                      readOnly
                      placeholder="Auto-calculated"
                      style={{
                        background: "var(--bg)",
                        color: "var(--text-muted)",
                        cursor: "not-allowed",
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Current Project</label>
                    <SearchableSelect
                      value={form.currentProject}
                      onChange={(val) => setForm({ ...form, currentProject: val })}
                      options={projects}
                      placeholder="Select Project"
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Project Assigning</label>
                    <input
                      type="date"
                      value={form.dateOfProjectAssigning}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          dateOfProjectAssigning: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Relevant Date</label>
                    <input
                      value={calcDuration(form.dateOfProjectAssigning)}
                      readOnly
                      placeholder="Auto-calculated"
                      style={{
                        background: "var(--bg)",
                        color: "var(--text-muted)",
                        cursor: "not-allowed",
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Manager</label>
                    <SearchableSelect
                      value={form.manager}
                      onChange={(val) => setForm({ ...form, manager: val })}
                      options={managers}
                      placeholder="Select Manager"
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Billable</label>
                    <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
                      {["yes", "no"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setForm({ ...form, billable: opt })}
                          style={{
                            flex: 1,
                            padding: "9px 0",
                            borderRadius: 8,
                            border: `2px solid ${form.billable === opt ? "var(--primary)" : "var(--border)"}`,
                            background:
                              form.billable === opt
                                ? "var(--primary)"
                                : "var(--card-bg)",
                            color:
                              form.billable === opt
                                ? "#fff"
                                : "var(--text-muted)",
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
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
            <div
              style={{
                display: "flex",
                gap: 10,
                padding: "16px 24px",
                borderTop: "1px solid var(--border)",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-profile-form"
                className="btn-primary"
                disabled={savingProfile}
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="profile-header">
        <div className="profile-stats">
     
          {/* <div className="stat stat-exp"> */}
            {/* <span className="stat-icon-emoji">📅</span> */}
            {/* <span className="stat-val">
              {calcDuration(profile.dateOfJoining) || "—"}
            </span>
            <span className="stat-lbl">Years of Experience</span>
          </div> */}

          {/* <div className="stat stat-relevant"> */}
            {/* <span className="stat-icon-emoji">💼</span> */}
            {/* <span className="stat-val stat-val-relevant">
              {calcDuration(profile.dateOfProjectAssigning) || "—"}
            </span>
            <span className="stat-lbl">Relevant Experience</span>
          </div> */}

               <div className="stat" onClick={() => navigate(ROUTES.SKILLS)}>
            {/* <span className="stat-icon-emoji">🎯</span> */}
            <span className="stat-val">{profile.skills?.length || 0}</span>
            <span className="stat-lbl">Skills</span>
          </div>

          <div className="stat" onClick={() => navigate(ROUTES.CERTIFICATIONS)}>
            {/* <span className="stat-icon-emoji">🏆</span> */}
            <span className="stat-val">
              {profile.certifications?.length || 0}
            </span>
            <span className="stat-lbl">Certificates</span>
          </div>

          <div className="stat" onClick={() => navigate(ROUTES.DOCUMENTS)}>
            {/* <span className="stat-icon-emoji">🏆</span> */}
            <span className="stat-val-text">
              {profile.resumeData?.length > 0 ?'Uploaded' : 'Not Uploaded'}
            </span>
            <span className="stat-lbl">Resume</span>
          </div>
          
        </div>
      </div>

      <div className="details-container">
        
        <div className="details-top-row">
        <div className="employment-card">
          <h3 className="employment-title">Personal Information</h3>

          <div className="employment-row">
            <span className="employment-label">📧 Email</span>
            <span className="employment-value">{profile.email || "-"}</span>
          </div>
             
              <div className="employment-row">
            <span className="employment-label">👔 Job Title</span>
            <span className="employment-value">{profile.jobTitle || "-"}</span>
          </div>
          <div className="employment-row">
            <span className="employment-label">🏢 Department</span>
            <span className="employment-value">
              {profile.department || "-"}
            </span>
          </div>

          <div className="employment-row">
            <span className="employment-label">📅 Date of Joining</span>
            <span className="employment-value">
              {profile.dateOfJoining || "-"}
            </span>
          </div>

          <div className="employment-row">
            <span className="employment-label">📅 Years Of Experience</span>
            <span className="employment-value">
              {calcDuration(profile.dateOfJoining) || "-"}
            </span>
          </div>

          <div className="employment-row">
            <span className="employment-label">💼 Current Project</span>
            <span className="employment-value">
              {profile.currentProject || "-"}
            </span>
          </div>

          <div className="employment-row">
            <span className="employment-label">📅 Relevant Experience</span>
            <span className="employment-value">
              {calcDuration(profile.dateOfProjectAssigning) || "-"}
            </span>
          </div>

          <div className="employment-row">
            <span className="employment-label">💰 Billable</span>
            <span className="employment-value">{profile.billable || "-"}</span>
          </div>

          <div className="employment-row">
            <span className="employment-label">👨‍💼 Manager</span>
            <span className="employment-value">{profile.manager || "-"}</span>
          </div>
      
        </div>
      
        <div className="skill-card">
          <h3 className="skill-title">Skill Overview</h3>
          <div className="skill-card-body">
          {profile.skills?.length > 0 ? (
            [...profile.skills].sort((a, b) => {
              if (a.skillType === "Primary Skill" && b.skillType !== "Primary Skill") return -1;
              if (a.skillType !== "Primary Skill" && b.skillType === "Primary Skill") return 1;
              return 0;
            }).map((skill) => (
              <div className="skill-row" key={skill.id || skill.name}>
                <div className="skill-info">
                  <span className="skill-name">{skill.name}</span>
                  <span className={`skill-type-badge ${
                    skill.skillType === "Primary Skill" ? "skill-type-primary" : "skill-type-secondary"
                  }`}>
                    {skill.skillType === "Primary Skill" ? "● Primary" : "○ Secondary"}
                  </span>
                  <span className={`badge ${
                    skill.proficiency === "Advanced" ? "badge-advanced"
                    : skill.proficiency === "Intermediate" ? "badge-intermediate"
                    : "badge-beginner"
                  }`}>
                    {skill.proficiency}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="no-skills">No skills added yet.</p>
          )}
          </div>
        </div>
       </div>
          <div className="cert-overview-card">
          <div className="cert-overview-header">
            <h3 className="skill-title" style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>Certification Overview</h3>
            {profile.certifications?.length > 0 && (
              <button className="cert-view-all-btn" onClick={() => navigate(ROUTES.CERTIFICATIONS)}>
                View All ↗
              </button>
            )}
          </div>

          <div className="cert-overview-grid">
            {profile.certifications?.length > 0 ? (
              profile.certifications.slice(0, 4).map((cert) => {
                const isExpired = cert.expiryDate && new Date(cert.expiryDate) < new Date();
                const expiringSoon =
                  cert.expiryDate &&
                  !isExpired &&
                  new Date(cert.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                return (
                  <div className="cert-detail-card" key={cert.id}>
                    <div className="cert-detail-icon">&#127942;</div>
                    <div className="cert-detail-body">
                      <span className="cert-detail-name">{cert.name}</span>
                      {cert.issuer && <span className="cert-detail-meta">&#127970; {cert.issuer}</span>}
                      {/* {cert.issuedOn && <span className="cert-detail-meta">&#128197; Issued: {cert.issuedOn}</span>}
                      {cert.expiryDate && <span className="cert-detail-meta">&#128197; Expires: {cert.expiryDate}</span>} */}
                    </div>
                    <div className="cert-detail-status">
                      {isExpired && <span className="cert-status-badge cert-status-expired">Expired</span>}
                      {expiringSoon && <span className="cert-status-badge cert-status-expiring">Expiring Soon</span>}
                      {!isExpired && !expiringSoon && cert.expiryDate && <span className="cert-status-badge cert-status-valid">Valid</span>}
                      {!cert.expiryDate && <span className="cert-status-badge cert-status-noexpiry">No Expiry</span>}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="no-skills">No certifications added yet.</p>
            )}
          </div>
        </div>

      </div>


      {savingProfile && <LoaderDialog message="Saving profile..." />}
      {/* {uploadingAvatar && <LoaderDialog message="Uploading profile picture..." />}
      {deletingAvatar && <LoaderDialog message="Removing profile picture..." />} */}
      {resumeUploading && <LoaderDialog message="Uploading resume..." />}
      {deletingResume && <LoaderDialog message="Deleting resume..." />}
    </div>
  );
}

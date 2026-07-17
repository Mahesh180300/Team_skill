import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import Button from "../components/common/Button";
import ConfirmDialog from "../components/common/ConfirmDialog";
import DialogBox from "../components/common/DialogBox";
import Loader from "../components/Loader";
import LoaderDialog from "../components/LoaderDialog";
import { useApi } from "../hooks/useApi";
import { ROUTES } from "../router/routes";
import InputField from "../components/common/InputField";
import DatePicker from "../components/common/DatePicker";

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
      window.dispatchEvent(new Event('profile-updated'));
    });
  };

  const uploadResume = async (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("Resume must be 2MB or less");
      return;
    }
    try {
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
          window.dispatchEvent(new Event('profile-updated'));
        } else if (data.error) {
          showToast(data.error);
        }
      });
    } catch (err) {
      showToast(err.message || "Resume upload failed");
    }
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
      <h2>My Profile</h2>
      <div className="page-header">

        <Button
          variant="primary"
          onClick={() => setEditing(true)}
          style={{ marginLeft: "auto", whiteSpace: "nowrap",width: "20%" }}
        >
          Edit Profile
        </Button>
      </div>
      {msg && <div className="toast success">{msg}</div>}

      <DialogBox
        isOpen={editing}
        onClose={() => setEditing(false)}
        title="Edit Profile"
        width={640}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            <Button variant="primary" type="submit" form="edit-profile-form" loading={savingProfile}>{savingProfile ? "Saving..." : "Save Changes"}</Button>
          </>
        }
      >
        <form id="edit-profile-form" onSubmit={save} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "gray", marginBottom: 10 }}>Personal Info</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <InputField label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <InputField label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
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
          <p style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "gray", marginBottom: 10 }}>Experience &amp; Project</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderRadius: 10, padding: 16, marginBottom: 8 }}>
            <DatePicker label="Date of Joining" value={form.dateOfJoining} onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })} />
            <InputField label="Years of Experience" value={calcDuration(form.dateOfJoining)} readOnly placeholder="Auto-calculated" />
            <div className="form-group">
              <label>Current Project</label>
              <select value={form.currentProject} onChange={(e) => setForm({ ...form, currentProject: e.target.value })}>
                <option value="">Select Project</option>
                {projects.map((p) => <option key={p.id} value={p.value}>{p.value}</option>)}
              </select>
            </div>
            <DatePicker label="Date of Project Assigning" value={form.dateOfProjectAssigning} onChange={(e) => setForm({ ...form, dateOfProjectAssigning: e.target.value })} />
            <InputField label="Relevant Date" value={calcDuration(form.dateOfProjectAssigning)} readOnly placeholder="Auto-calculated" />
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
                  <button key={opt} type="button" onClick={() => setForm({ ...form, billable: opt })} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `2px solid ${form.billable === opt ? "var(--primary)" : "var(--border)"}`, background: form.billable === opt ? "var(--primary)" : "var(--card-bg)", color: form.billable === opt ? "#fff" : "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.15s" }}>
                    {opt === "yes" ? "✓ Yes" : "✗ No"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>
      </DialogBox>

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

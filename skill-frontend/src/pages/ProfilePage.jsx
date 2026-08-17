import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import Button from "../components/common/Button";
import Dropdown from "../components/common/Dropdown";
import DialogBox from "../components/common/DialogBox";
import Loader from "../components/Loader";
import LoaderDialog from "../components/LoaderDialog";
import { useApi } from "../hooks/useApi";
import { ROUTES } from "../router/routes";
import InputField from "../components/common/InputField";
import DatePicker from "../components/common/DatePicker";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Breadcrumb from "../components/common/Breadcrumb";
import DeleteButton from "../components/common/DeleteButton";
import useDeleteConfirm from "../hooks/useDeleteConfirm";
import DonutChart from "../components/common/DonutChart";
import SkillTypeBarChart from "../components/common/SkillTypeBarChart";
import CertLogo from "../components/common/CertLogo";
import { useSidebar } from "../context/SidebarContext";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, setProfile: setSharedProfile } = useAuth();
  const { collapsed } = useSidebar();
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
        if (data.resumeUrl || data.resumeFileName) {
          setProfile((p) => ({ ...p, ...data }));
          setSharedProfile((p) => ({ ...p, ...data }));
          showToast("Resume uploaded successfully");
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
      setProfile((p) => ({ ...p, resumeData: "", resumeFileName: "", resumeFileType: "", resumeUrl: null }));
      setSharedProfile((p) => ({ ...p, resumeData: "", resumeFileName: "", resumeFileType: "", resumeUrl: null }));
      showToast("Resume deleted successfully.");
    });
  };

  const projectFontSize = (name) => {
    if (!name) return undefined;
    const words = name.trim().split(/\s+/);
    if (words.length <= 2) return undefined;       // keep existing size
    if (name.length <= 20) return "18px";           // 3 short words
    if (name.length <= 30) return "14px";           // medium length
    return "13px";                                  // long name
  };

  const { triggerDelete: confirmDelete, DeleteDialog } = useDeleteConfirm({
    onConfirm: deleteResume,
    title: "Delete Resume",
    message: "Are you sure you want to delete your resume? This cannot be undone.",
    confirmText: "Yes, Delete",
  });

  const calcCompletion = (p) => {
    const fields = [
      { label: "Profile Picture", done: !!p.avatar },
      { label: "Skills", done: p.skills?.length > 0 },
      { label: "Certifications", done: p.certifications?.length > 0 },
      { label: "Resume", done: !!(p.resumeUrl || p.resumeData) },
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
      <Breadcrumb action={
        <Button variant="primary" onClick={() => setEditing(true)} style={{ whiteSpace: "nowrap" }}>
          Edit Profile
        </Button>
      } />
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
              <Dropdown value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} options={departments.map((d) => ({ value: d.value, label: d.value }))} placeholder="--Select Department--" />
            </div>
            <div className="form-group">
              <label>Job Title</label>
              <Dropdown value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} options={jobTitles.map((j) => ({ value: j.value, label: j.value }))} placeholder="--Select Job Title--" />
            </div>
          </div>
          <p style={{ fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "gray", marginBottom: 10 }}>Experience &amp; Project</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderRadius: 10, padding: 16, marginBottom: 8 }}>
            <DatePicker label="Date of Joining" value={form.dateOfJoining} onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })} />
            <InputField label="Years of Experience" value={calcDuration(form.dateOfJoining)} readOnly />
            <div className="form-group">
              <label>Current Project</label>
              <Dropdown value={form.currentProject} onChange={(e) => setForm({ ...form, currentProject: e.target.value })} options={projects.map((p) => ({ value: p.value, label: p.value }))} placeholder="--Select Project--" />
            </div>
            <DatePicker label="Date of Project Assigning" value={form.dateOfProjectAssigning} onChange={(e) => setForm({ ...form, dateOfProjectAssigning: e.target.value })} />
            <InputField label="Relevant Date" value={calcDuration(form.dateOfProjectAssigning)} readOnly />
            <div className="form-group">
              <label>Manager</label>
              <Dropdown value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} options={managers.map((m) => ({ value: m.value, label: m.value }))} placeholder="--Select Manager--" />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Billable</label>
              <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
                {["yes", "no"].map((opt) => (
                  <button key={opt} type="button" onClick={() => setForm({ ...form, billable: opt })} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `2px solid ${form.billable === opt ? "#2e2f41" : "var(--border)"}`, background: form.billable === opt ? "#2e2f41" : "var(--card-bg)", color: form.billable === opt ? "#fff" : "var(--text-muted)", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.15s" }}>
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

          <div className="psc psc-purple" onClick={() => navigate(ROUTES.SKILLS)}>
            <div className="psc-icon-wrap">
              <span className="psc-icon"><i class="fas fa-code"></i></span>
            </div>
            <div className="psc-body">
              <span className="psc-value">{profile.skills?.length || 0}</span>
              <span className="psc-label">Skills</span>
              <span className="psc-sub">Keep learning, keep growing</span>
            </div>
          </div>

          <div className="psc psc-blue" onClick={() => navigate(ROUTES.CERTIFICATIONS)}>
            <div className="psc-icon-wrap">
              <span className="psc-icon"><i class="fas fa-trophy"></i></span>
            </div>
            <div className="psc-body">
              <span className="psc-value">{profile.certifications?.length || 0}</span>
              <span className="psc-label">Certifications</span>
              <span className="psc-sub">Your achievements matter</span>
            </div>
          </div>

          <div className="psc psc-green" onClick={() => navigate(ROUTES.DOCUMENTS)}>
            <div className="psc-icon-wrap">
              <span className="psc-icon"><i class="fas fa-file-alt"></i></span>
            </div>
            <div className="psc-body">
              <span className="psc-value">{(profile.resumeUrl || profile.resumeData?.length > 0) ? "Uploaded" : "Not Uploaded"}</span>
              <span className="psc-label">Resume</span>
           <span className="psc-sub">
  {profile.resumeUrl || profile.resumeData?.length > 0 ? (
    <>
      Keep your profile updated
    </>
  ) : (
    <>
      Upload your <br />
      resume
    </>
  )}
</span>
            </div>
          </div>

          <div className="psc psc-orange">
            <div className="psc-icon-wrap">
              <span className="psc-icon"><i class="fas fa-briefcase"></i></span>
            </div>
            <div className="psc-body">
              <span
                className="psc-value psc-value-project"
                style={{ fontSize: projectFontSize(profile.currentProject) }}
              >
                {profile.currentProject || "Not Assigned"}
              </span>
              <span className="psc-label">Current Project</span>
              <span className="psc-sub">
                {profile.currentProject
                  ? `Since ${calcDuration(profile.dateOfProjectAssigning) || "recently"}`
                  : "No project assigned"}
              </span>
            </div>
          </div>

        </div>
      </div>

         {/* ── Skill Analytics ──────────────────────────────────────────── */}
 <div className="dashboard-row">
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 ,borderBottom: "1px solid #eee",paddingBottom:"7px",paddingTop:"7px"}}>Skill Proficiency Distribution</h3>
          <DonutChart
            slices={[
              { key: "Beginner",     label: "Beginner",     color: "#4ec193", count: (profile.skills || []).filter(s => s.proficiency === "Beginner").length },
              { key: "Intermediate", label: "Intermediate", color: "#2c6dbc", count: (profile.skills || []).filter(s => s.proficiency === "Intermediate").length },
              { key: "Advanced",     label: "Advanced",     color: "#e86f0c", count: (profile.skills || []).filter(s => s.proficiency === "Advanced").length },
            ]}
            centerLabel="Total Skills"
            itemLabel="skill"
          />
        </div>

        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, borderBottom: "1px solid #eee", paddingBottom: "7px", paddingTop: "7px" }}>Skill Category Distribution</h3>
          <SkillTypeBarChart
            primarySkills={(profile.skills || []).filter(s => s.skillType === "Primary Skill").length}
            secondarySkills={(profile.skills || []).filter(s => s.skillType === "Secondary Skill").length}
          />
        </div>
      </div>

      <div className="details-container">
        
        <div className="details-top-row">
        <div className="employment-card">
          <h3 className="employment-title">Personal Information</h3>

          <div className="employment-row">
            <span className="employment-label"><i className="fa-solid fa-envelope employment-icon"></i>
             Email</span>
            <span className="employment-value">{profile.email || "-"}</span>
          </div>
             
              <div className="employment-row">
            <span className="employment-label"><i className="fa-solid fa-briefcase employment-icon"></i> Job Title</span>
            <span className="employment-value">{profile.jobTitle || "-"}</span>
          </div>
          <div className="employment-row">
            <span className="employment-label"><i className="fa-solid fa-building employment-icon"></i> Department</span>
            <span className="employment-value">
              {profile.department || "-"}
            </span>
          </div>

          <div className="employment-row">
            <span className="employment-label"><i className="fa-solid fa-calendar-days employment-icon"></i> Date of Joining</span>
            <span className="employment-value">
              {profile.dateOfJoining || "-"}
            </span>
          </div>

          <div className="employment-row">
            <span className="employment-label"><i className="fa-solid fa-hourglass-half  employment-icon"></i> Years Of Experience</span>
            <span className="employment-value">
              {calcDuration(profile.dateOfJoining) || "-"}
            </span>
          </div>

          <div className="employment-row">
            <span className="employment-label"><i className="fa-solid  fa-diagram-project employment-icon"></i> Current Project</span>
            <span className="employment-value">
              {profile.currentProject || "-"}
            </span>
          </div>

          <div className="employment-row">
            <span className="employment-label"><i className="fa-solid fa-business-time employment-icon"></i> Relevant Experience</span>
            <span className="employment-value">
              {calcDuration(profile.dateOfProjectAssigning) || "-"}
            </span>
          </div>

          <div className="employment-row">
            <span className="employment-label"><i className="fa-solid fa-money-bill-wave  employment-icon"></i> Billable</span>
            <span className="employment-value">{profile.billable || "-"}</span>
          </div>

          <div className="employment-row">
            <span className="employment-label"><i className="fa-solid fa-user-tie employment-icon"></i> Manager</span>
            <span className="employment-value">{profile.manager || "-"}</span>
          </div>
      
        </div>

      
        <div className="skill-card">
          <div className="cert-overview-header" style={{ marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #e5e7eb" }}>
            <h3 className="skill-title" style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>Skill Overview</h3>
            {profile.skills?.length > 9 && (
              <button className="cert-view-all-btn" onClick={() => navigate(ROUTES.SKILLS)}>
                View All &#8594;
              </button>
            )}
          </div>

          {profile.skills?.length > 0 ? (
            [...profile.skills].sort((a, b) => {
              if (a.skillType === "Primary Skill" && b.skillType !== "Primary Skill") return -1;
              if (a.skillType !== "Primary Skill" && b.skillType === "Primary Skill") return 1;
              return 0;
            }).slice(0, 9).map((skill) => (
              <div className="skill-row" key={skill.id || skill.name}>
                <div className="skill-info">
                  <span className="skill-name">{skill.name}</span>
                  <span className={`skill-type-badge ${
                    skill.skillType === "Primary Skill" ? "skill-type-primary" : "skill-type-secondary"
                  }`}>
                    {skill.skillType === "Primary Skill" ? "● Primary" : "● Secondary"}
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

{/* Row 2: Certification Overview full width */}
        <div className="cert-overview-card" style={{ marginTop: 15, padding: 16, borderRadius: 12, background: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
          <div className="cert-overview-header">
            <h3 className="skill-title" style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>Certification Overview</h3>
            {profile.certifications?.length > 0 && (
              <button className="cert-view-all-btn" onClick={() => navigate(ROUTES.CERTIFICATIONS)}>
                View All &#8594;
              </button>
            )}
          </div>
          <div className="cert-overview-grid" style={{ gridTemplateColumns: `repeat(${collapsed ? 5 : 4}, 1fr)` }}>
            {profile.certifications?.length > 0 ? (
              profile.certifications.slice(0, collapsed ? 5 : 4).map((cert) => {
                const isExpired = cert.expiryDate && new Date(cert.expiryDate) < new Date();
                const expiringSoon =
                  cert.expiryDate &&
                  !isExpired &&
                  new Date(cert.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                return (
                  <div className="cert-detail-card" key={cert.id}>
                    <div className="cert-detail-icon">
                      <CertLogo name={cert.name} size={28} />
                    </div>
                    <div className="cert-detail-body">
                     
                      <span className="cert-detail-name">{cert.name}</span>
                      {cert.issuer && <span className="cert-detail-meta">Issued by : {cert.issuer}</span>}
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
          {/* {profile.certifications?.length > 4 && (
            <button className="cert-show-all-btn" onClick={() => navigate(ROUTES.CERTIFICATIONS)}>
              Show All {profile.certifications.length} Certificates
            </button>
          )} */}
        </div>

      {savingProfile && <LoaderDialog message="Saving profile..." />}
      {/* {uploadingAvatar && <LoaderDialog message="Uploading profile picture..." />}
      {deletingAvatar && <LoaderDialog message="Removing profile picture..." />} */}
      {resumeUploading && <LoaderDialog message="Uploading resume..." />}
      {deletingResume && <LoaderDialog message="Deleting resume..." />}
    </div>
  );
}

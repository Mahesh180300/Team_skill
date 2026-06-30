import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import Loader from "../components/Loader";
import LoaderDialog from "../components/LoaderDialog";
import { useApi } from "../hooks/useApi";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const LEVEL_COLOR = { Beginner: "badge-beginner", Intermediate: "badge-intermediate", Advanced: "badge-advanced" };
const SKILL_TYPES = ["Primary Skill", "Secondary Skill"];

const STAT_META = [
  { key: "total",          label: "Total Skills",     icon: " 🗂️", iconBg: "#dbeafe", iconColor: "#1d4ed8", accent: "#1d4ed8", lightBg: "#eff6ff", subtitle: "All skills added" },
  { key: "primarySkill",   label: "Primary Skills",   icon: " ⭐", iconBg: "#dcfce7", iconColor: "#16a34a", accent: "#16a34a", lightBg: "#f0fdf4", subtitle: "Core expertise" },
  { key: "secondarySkill", label: "Secondary Skills", icon: "🔶", iconBg: "#fef3c7", iconColor: "#d97706", accent: "#d97706", lightBg: "#fffbeb", subtitle: "Supporting skills" },
];

const EMPTY_FORM = { name: "", skillType: "Primary Skill", proficiency: "Beginner", yearsUsed: "", monthsUsed: "" };

export default function SkillsPage() {
  const { token, setProfile: setSharedProfile } = useAuth();
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState("");
  const [durationError, setDurationError] = useState("");
  const [toast, setToast] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [addingSkill, setAddingSkill] = useState(false);
  const [updatingSkill, setUpdatingSkill] = useState(false);
  const [deletingSkill, setDeletingSkill] = useState(false);
  const [pendingSkills, setPendingSkills] = useState([]);
  const [skillOptions, setSkillOptions] = useState([]);

  const callAdd = useApi(setAddingSkill);
  const callUpdate = useApi(setUpdatingSkill);
  const callDelete = useApi(setDeletingSkill);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    setLoadingSkills(true);
    Promise.all([
      api.getProfile(token),
      api.getLookupValues("Skills"),
    ]).then(([profileData, lookupData]) => {
      setSkills(profileData.skills || []);
      setSkillOptions(Array.isArray(lookupData) ? lookupData.map((v) => v.value || v) : []);
      setLoadingSkills(false);
    });
  }, []);

  const save = async () => {
    await callUpdate(async () => {
      const data = await api.updateSkill(token, editId, {
        ...editForm,
        yearsUsed: Number(editForm.yearsUsed) || 0,
        monthsUsed: Number(editForm.monthsUsed) || 0,
      });
      setSkills(data.skills);
      setSharedProfile((p) => ({ ...p, skills: data.skills }));
      setEditId(null);
      setShowEditModal(false);
      showToast("Skill updated successfully!");
    });
  };

  const remove = async (skillId) => {
    await callDelete(async () => {
      const data = await api.deleteSkill(token, skillId);
      setSkills(data.skills);
      setSharedProfile((p) => ({ ...p, skills: data.skills }));
      setDeleteTargetId(null);
      showToast("Skill deleted!");
    });
  };

  if (loadingSkills) return <Loader message="Loading skills..." />;

  const counts = {
    total:          skills.length,
    primarySkill:   skills.filter((s) => s.skillType === "Primary Skill").length,
    secondarySkill: skills.filter((s) => s.skillType === "Secondary Skill").length,
  };

  const addToPending = (e) => {
    e.preventDefault();
    setError("");
    setDurationError("");
    if (!form.name) { setError("Please select a skill."); return; }
    const alreadyExists = skills.some((s) => s.name === form.name) || pendingSkills.some((s) => s.name === form.name);
    if (alreadyExists) { setError(`"${form.name}" is already added.`); return; }
    if (!Number(form.yearsUsed) && !Number(form.monthsUsed)) {
      setDurationError("Please enter at least Years or Months used.");
      return;
    }
    setPendingSkills((prev) => [...prev, { ...form, yearsUsed: Number(form.yearsUsed) || 0, monthsUsed: Number(form.monthsUsed) || 0 }]);
    setForm(EMPTY_FORM);
    setDurationError("");
  };

  const removePending = (idx) => setPendingSkills((prev) => prev.filter((_, i) => i !== idx));

  const bulkSave = async () => {
    if (!pendingSkills.length) return;
    await callAdd(async () => {
      const data = await api.bulkAddSkills(token, pendingSkills);
      if (data.error) { setError(data.error); return; }
      setSkills(data.skills);
      setSharedProfile((p) => ({ ...p, skills: data.skills }));
      setPendingSkills([]);
      setForm(EMPTY_FORM);
      setShowAddModal(false);
      showToast("Skills added successfully!");
    });
  };

  const formatDuration = (s) => {
    const parts = [];
    if (s.yearsUsed > 0) parts.push(`${s.yearsUsed} yr${s.yearsUsed !== 1 ? "s" : ""}`);
    if (s.monthsUsed > 0) parts.push(`${s.monthsUsed} mo`);
    return parts.join(" ");
  };

  const sorted = [...skills].sort((a, b) => {
    if (a.skillType === "Primary Skill" && b.skillType !== "Primary Skill") return -1;
    if (a.skillType !== "Primary Skill" && b.skillType === "Primary Skill") return 1;
    return 0;
  });
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      {addingSkill && <LoaderDialog message="Adding skill..." />}
      {updatingSkill && <LoaderDialog message="Updating skill..." />}
      {deletingSkill && <LoaderDialog message="Deleting skill..." />}
      <div className="page">
      <div className="page-header"><h2>My Skills</h2></div>
      {toast && <div className="toast success">{toast}</div>}

      <button
        className="btn-primary"
        style={{ width: "20%", marginLeft: "80%" }}
        onClick={() => setShowAddModal(true)}
        disabled={addingSkill || updatingSkill || deletingSkill}
      >
        + Add Skill
      </button>

      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => { setShowEditModal(false); setEditId(null); }}>✕</button>
            <div className="card form-card">
              <h3>Edit Skill</h3>
              <div className="inline-form">
                <div className="form-group" style={{ width: "100%" }}>
                  <label>Skill Type</label>
                  <select value={editForm.skillType} onChange={(e) => setEditForm({ ...editForm, skillType: e.target.value })}>
                    {SKILL_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ width: "100%" }}>
                  <label>Skill Name</label>
                  <input value={editForm.name} readOnly style={{ background: "var(--bg)", color: "var(--text-muted)", cursor: "not-allowed" }} />
                </div>
                <div className="form-group">
                  <label>Proficiency</label>
                  <select value={editForm.proficiency} onChange={(e) => setEditForm({ ...editForm, proficiency: e.target.value })}>
                    {LEVELS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Years Used</label>
                  <input type="number" min="0" placeholder="0" value={editForm.yearsUsed} onChange={(e) => setEditForm({ ...editForm, yearsUsed: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Months Used <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(0–11)</span></label>
                  <input type="number" min="0" max="11" placeholder="0" value={editForm.monthsUsed} onChange={(e) => setEditForm({ ...editForm, monthsUsed: e.target.value })} />
                </div>
                <button className="btn-primary" style={{ display: "block", margin: "12px auto 0", width: "100%" }} onClick={save} disabled={updatingSkill}>
                  {updatingSkill ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => { setShowAddModal(false); setPendingSkills([]); setForm(EMPTY_FORM); }}>✕</button>
           <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 ,fontSize: "16px",fontWeight: "500"}}>
            <label>Add Skills</label>
           </div>
            <div className="card form-card">
              

              {pendingSkills.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                    <div className="form-group" style={{ width: "100%" }}>
                  <label>Selected Skills ({pendingSkills.length})</label>
                  </div>

                  {pendingSkills.map((s, i) => {
                    const isPrimary = s.skillType === "Primary Skill";
                    const clr = isPrimary ? "#10b981" : "#854d0e";
                    const bg  = isPrimary ? "#d1fae5" : "#fef3c7";
                    return (
                      <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: bg, color: clr, borderRadius: 20, padding: "4px 10px", fontSize: 13, fontWeight: 500 }}>
                        {s.name} <span style={{ fontSize: 10, opacity: 0.7 }}>({s.skillType})</span>
                        <button type="button" onClick={() => removePending(i)} style={{ background: "none", border: "none", cursor: "pointer", color: clr, fontWeight: 700, lineHeight: 1, padding: "0 2px" }}>✕</button>
                      </span>
                    );
                  })}
                </div>
              )}

              <form onSubmit={addToPending} className="inline-form">
               
                <div className="form-group" style={{ width: "100%" }}>
                  <label>Skill Type</label>
                  <select value={form.skillType} onChange={(e) => setForm({ ...form, skillType: e.target.value })}>
                    {SKILL_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                 <div className="form-group" style={{ width: "100%" }}>
                  <label>Skill Name</label>
                  <select value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required>
                    <option value="">-- Select Skill --</option>
                    {skillOptions.filter((s) => !skills.some((sk) => sk.name === s) && !pendingSkills.some((sk) => sk.name === s)).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Proficiency</label>
                  <select value={form.proficiency} onChange={(e) => setForm({ ...form, proficiency: e.target.value })}>
                    {LEVELS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Years Used</label>
                  <input type="number" min="0" placeholder="0" value={form.yearsUsed} onChange={(e) => setForm({ ...form, yearsUsed: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Months Used <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(0–11)</span></label>
                  <input type="number" min="0" max="11" placeholder="0" value={form.monthsUsed} onChange={(e) => setForm({ ...form, monthsUsed: e.target.value })} />
                </div>
                {durationError && <p className="error" style={{ width: "100%" }}>{durationError}</p>}
                {error && <p className="error" style={{ width: "100%" }}>{error}</p>}
                <button type="submit" className="btn-secondary" style={{ display: "block", margin: "15px auto 0" }}>
                  + Add
                </button>
              </form>

              {pendingSkills.length > 0 && (
                <button className="btn-primary" style={{ display: "block", margin: "12px auto 0", width: "100%" }} onClick={bulkSave} disabled={addingSkill}>
                  {addingSkill ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="skill-stats-grid">
        {STAT_META.map(({ key, label, icon, iconBg, iconColor, accent, lightBg, subtitle }) => {
          const pct = counts.total > 0 ? Math.round((counts[key] / counts.total) * 100) : (key === "total" ? 100 : 0);
          const barWidth = key === "total" ? 100 : pct;
          return (
            <div key={key} className="skill-stat-card" style={{ "--stat-accent": accent }}>
              <div className="skill-stat-top">
                <div className="skill-stat-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
                <span className="skill-stat-label" style={{ background: lightBg, color: accent }}>{label}</span>
              </div>
              <div className="skill-stat-count" style={{ color: accent }}>{counts[key]}</div>
              {/* <div className="skill-stat-subtitle">{subtitle}</div> */}
              <div className="skill-stat-bar-track">
                <div className="skill-stat-bar-fill" style={{ width: `${barWidth}%`, background: accent }} />
              </div>
              <hr className="skill-stat-divider" />
              {/* <div className="skill-stat-footer">
                <span className="skill-stat-footer-label">{key === "total" ? "All categories" : `of ${counts.total} total`}</span>
                <span className="skill-stat-pct-badge" style={{ background: lightBg, color: accent }}>
                  {key === "total" ? `${counts.total} skills` : `${pct}%`}
                </span>
              </div> */}
            </div>
          );
        })}
      </div>

      {skills.length === 0 ? (
        <div className="empty">No skills added yet. Add your first skill above!</div>
      ) : (
        <div>
          <div className="skills-table">
            <div className="skills-table-header">
              <div className="st-col st-col-num">#</div>
              <div className="st-col st-col-name">Skill Name</div>
              <div className="st-col st-col-type">Type</div>
              <div className="st-col st-col-proficiency">Proficiency</div>
              <div className="st-col st-col-duration">Experience</div>
              <div className="st-col st-col-actions">Actions</div>
            </div>
            {paginated.map((s, idx) => {
              const globalIdx = (currentPage - 1) * PAGE_SIZE + idx;
              return (
                <div key={s.id} className={`skills-table-row ${s.skillType === "Primary Skill" ? "skill-card--primary" : "skill-card--secondary"}`}>
                  {(
                    <>
                      <div className="st-col st-col-num"><span className="st-num">{globalIdx + 1}</span></div>
                      <div className="st-col st-col-name"><span className="skill-name">{s.name}</span></div>
                      <div className="st-col st-col-type">
                        <span className={`skill-type-badge ${s.skillType === "Primary Skill" ? "skill-type-primary" : "skill-type-secondary"}`}>
                          {s.skillType === "Primary Skill" ? "● Primary" : "○ Secondary"}
                        </span>
                      </div>
                      <div className="st-col st-col-proficiency"><span className={`badge ${LEVEL_COLOR[s.proficiency]}`}>{s.proficiency}</span></div>
                      <div className="st-col st-col-duration"><span className="skill-years">{formatDuration(s) || "—"}</span></div>
                      <div className="st-col st-col-actions">
                        <button className="skill-btn-edit" onClick={() => { setEditId(s.id); setEditForm({ name: s.name, skillType: s.skillType, proficiency: s.proficiency, yearsUsed: s.yearsUsed, monthsUsed: s.monthsUsed || 0 }); setShowEditModal(true); }}>Edit</button>
                        <button className="skill-btn-delete" onClick={() => setDeleteTargetId(s.id)}>Delete</button>
                      </div>
                    </>
                  )
                  }
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Page {currentPage} of {totalPages}</span>
              <button className="btn-secondary btn-sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} className="btn-secondary btn-sm" onClick={() => setCurrentPage(p)}
                  style={p === currentPage ? { background: "var(--primary)", color: "#fff", borderColor: "var(--primary)" } : {}}>
                  {p}
                </button>
              ))}
              <button className="btn-secondary btn-sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next →</button>
            </div>
          )}
        </div>
      )}

      {deleteTargetId && (
        <ConfirmDialog
          icon="🗑️"
          title="Delete Skill"
          message="Are you sure want to delete this skill? This cannot be undone."
          confirmText="Yes, Delete"
          cancelText="Cancel"
          onConfirm={() => remove(deleteTargetId)}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
      </div>
    </>
  );
}

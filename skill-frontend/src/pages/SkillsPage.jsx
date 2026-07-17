import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import Button from "../components/common/Button";
import Dropdown from "../components/common/Dropdown";
import ConfirmDialog from "../components/common/ConfirmDialog";
import DialogBox from "../components/common/DialogBox";
import Loader from "../components/Loader";
import LoaderDialog from "../components/LoaderDialog";
import { useApi } from "../hooks/useApi";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
// const LEVEL_COLOR = { Beginner: "badge-beginner", Intermediate: "badge-intermediate", Advanced: "badge-advanced" };
const SKILL_TYPES = ["Primary Skill", "Secondary Skill"];

const STAT_META = [
  { key: "total",          label: "Total Skills",     icon: " 🗂️", iconBg: "#c1d0e5", iconColor: "#1d4ed8", accent: "#1d3986", lightBg: "#eff6ff", subtitle: "All skills added" },
  { key: "primarySkill",   label: "Primary Skills",   icon: " ⭐", iconBg: "#b4e5c5", iconColor: "#16a34a", accent: "#1c793e", lightBg: "#f0fdf4", subtitle: "Core expertise" },
  { key: "secondarySkill", label: "Secondary Skills", icon: "🔶", iconBg: "#ffc395", iconColor: "#d97706", accent: "#cd7510", lightBg: "#fffbeb", subtitle: "Supporting skills" },
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
  const [fieldErrors, setFieldErrors] = useState({});
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
    const errs = {};
    if (!form.skillType) errs.skillType = "Skill Type is required.";
    if (!form.name) errs.name = "Skill Name is required.";
    if (!form.proficiency) errs.proficiency = "Proficiency is required.";
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    const alreadyExists = skills.some((s) => s.name === form.name) || pendingSkills.some((s) => s.name === form.name);
    if (alreadyExists) { setError(`"${form.name}" is already added.`); return; }
    setPendingSkills((prev) => [...prev, { ...form, yearsUsed: Number(form.yearsUsed) || 0, monthsUsed: Number(form.monthsUsed) || 0 }]);
    setForm(EMPTY_FORM);
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

      <Button
        variant="primary"
        style={{ width: "20%", marginLeft: "80%" }}
        onClick={() => setShowAddModal(true)}
        disabled={addingSkill || updatingSkill || deletingSkill}
      >
        Add Skill
      </Button>

      <DialogBox
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditId(null); }}
        title="Edit Skill"
        width={500}
        footer={
          <Button variant="primary" style={{ width: "100%" }} onClick={save} loading={updatingSkill}>
            {updatingSkill ? "Saving..." : "Save Changes"}
          </Button>
        }
      >
        <div className="card form-card">
          <div className="inline-form">
            <div className="form-group" style={{ width: "100%" }}>
              <label>Skill Type</label>
              <Dropdown value={editForm.skillType} onChange={(e) => setEditForm({ ...editForm, skillType: e.target.value })} options={SKILL_TYPES} placeholder="--Select Skill Type--" />
            </div>
            <div className="form-group" style={{ width: "100%" }}>
              <label>Skill Name</label>
              <input value={editForm.name} readOnly style={{ background: "var(--bg)", color: "var(--text-muted)", cursor: "not-allowed" }} />
            </div>
            <div className="form-group">
              <label>Proficiency</label>
              <Dropdown value={editForm.proficiency} onChange={(e) => setEditForm({ ...editForm, proficiency: e.target.value })} options={LEVELS} placeholder="--Select Proficiency--" />
            </div>
            <div className="form-group">
              <label>Years Used</label>
              <input type="number" min="0" placeholder="0" value={editForm.yearsUsed} onChange={(e) => setEditForm({ ...editForm, yearsUsed: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Months Used <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(0–11)</span></label>
              <input type="number" min="0" max="11" placeholder="0" value={editForm.monthsUsed} onChange={(e) => setEditForm({ ...editForm, monthsUsed: e.target.value })} />
            </div>
          </div>
        </div>
      </DialogBox>

      <DialogBox
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setPendingSkills([]); setForm(EMPTY_FORM); setFieldErrors({}); setError(""); }}
        title="Add Skills"
        width={550}
        footer={
          pendingSkills.length > 0 ? (
            <Button variant="primary" style={{ width: "100%" }} onClick={bulkSave} loading={addingSkill}>
              {addingSkill ? "Saving..." : "Save"}
            </Button>
          ) : null
        }
      >
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
              <label>Skill Type <span style={{ color: "red" }}>*</span></label>
              <Dropdown value={form.skillType} onChange={(e) => { setForm({ ...form, skillType: e.target.value }); setFieldErrors((p) => ({ ...p, skillType: "" })); }} options={SKILL_TYPES} placeholder="--Select Skill Type--" />
              {fieldErrors.skillType && <span style={{ color: "red", fontSize: 12 }}>{fieldErrors.skillType}</span>}
            </div>
            <div className="form-group" style={{ width: "100%" }}>
              <label>Skill Name <span style={{ color: "red" }}>*</span></label>
              <Dropdown value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setFieldErrors((p) => ({ ...p, name: "" })); }} options={skillOptions.filter((s) => !skills.some((sk) => sk.name === s) && !pendingSkills.some((sk) => sk.name === s))} placeholder="-- Select Skill --" />
              {fieldErrors.name && <span style={{ color: "red", fontSize: 12 }}>{fieldErrors.name}</span>}
            </div>
            <div className="form-group">
              <label>Proficiency <span style={{ color: "red" }}>*</span></label>
              <Dropdown value={form.proficiency} onChange={(e) => { setForm({ ...form, proficiency: e.target.value }); setFieldErrors((p) => ({ ...p, proficiency: "" })); }} options={LEVELS} placeholder="--Select Proficiency--"  />
              {fieldErrors.proficiency && <span style={{ color: "red", fontSize: 12 }}>{fieldErrors.proficiency}</span>}
            </div>
            <div className="form-group">
              <label>Years Used <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(Optional)</span></label>
              <input type="number" min="0" placeholder="0" value={form.yearsUsed} onChange={(e) => setForm({ ...form, yearsUsed: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Months Used <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(Optional, 0–11)</span></label>
              <input type="number" min="0" max="11" placeholder="0" value={form.monthsUsed} onChange={(e) => setForm({ ...form, monthsUsed: e.target.value })} />
            </div>
            {error && <p className="error" style={{ width: "100%" }}>{error}</p>}
            <Button type="submit" variant="primary" style={{ display: "block", margin: "15px auto 0" }}>
              Add
            </Button>
          </form>
        </div>
      </DialogBox>

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
              <div className="st-col st-col-num">S.No</div>
              <div className="st-col st-col-name">Skill Name</div>
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
                      <div className="st-col st-col-name" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <span className="skill-name">{s.name}</span>
                        <span className={`skill-type-badge ${s.skillType === "Primary Skill" ? "skill-type-primary" : "skill-type-secondary"}`} style={{ fontSize: 9, }}>
                          {s.skillType === "Primary Skill" ? "● Primary" : "● Secondary"}
                        </span>
                      </div>
                      <div className="st-col st-col-proficiency"><span className={`badge ${[s.proficiency]}`}>{s.proficiency}</span></div>
                      <div className="st-col st-col-duration"><span className="skill-years">{formatDuration(s) || "—"}</span></div>
                      <div className="st-col st-col-actions">
                        <Button variant="edit" onClick={() => { setEditId(s.id); setEditForm({ name: s.name, skillType: s.skillType, proficiency: s.proficiency, yearsUsed: s.yearsUsed, monthsUsed: s.monthsUsed || 0 }); setShowEditModal(true); }}>Edit</Button>
                        <Button variant="delete" onClick={() => setDeleteTargetId(s.id)}>Delete</Button>
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

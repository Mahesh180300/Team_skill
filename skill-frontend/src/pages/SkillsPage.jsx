import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import ConfirmDialog from "../components/ConfirmDialog";
import Loader from "../components/Loader";
import LoaderDialog from "../components/LoaderDialog";
import { useApi } from "../hooks/useApi";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const LEVEL_COLOR = { Beginner: "badge-beginner", Intermediate: "badge-intermediate", Advanced: "badge-advanced" };

const STAT_META = [
  { key: "total",        label: "Total Skills", icon: "🗂️", iconBg: "#ede9fe", iconColor: "#6366f1", accent: "#6366f1", lightBg: "#f5f3ff" },
  { key: "Beginner",     label: "Beginner",     icon: "📶", iconBg: "#dbeafe", iconColor: "#3b82f6", accent: "#3b82f6", lightBg: "#eff6ff" },
  { key: "Intermediate", label: "Intermediate", icon: "✨", iconBg: "#fef3c7", iconColor: "#f59e0b", accent: "#f59e0b", lightBg: "#fffbeb" },
  { key: "Advanced",     label: "Advanced",     icon: "🏆", iconBg: "#d1fae5", iconColor: "#10b981", accent: "#10b981", lightBg: "#ecfdf5" },
];

const EMPTY_FORM = { name: "", proficiency: "Beginner", yearsUsed: "", monthsUsed: "" };

export default function SkillsPage() {
  const { token } = useAuth();
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState("");
  const [durationError, setDurationError] = useState("");
  const [toast, setToast] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [addingSkill, setAddingSkill] = useState(false);
  const [updatingSkill, setUpdatingSkill] = useState(false);
  const [deletingSkill, setDeletingSkill] = useState(false);

  const callAdd = useApi(setAddingSkill);
  const callUpdate = useApi(setUpdatingSkill);
  const callDelete = useApi(setDeletingSkill);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    setLoadingSkills(true);
    api.getProfile(token).then((d) => {
      setSkills(d.skills || []);
      setLoadingSkills(false);
    });
  }, []);

  const save = async (skillId) => {
    await callUpdate(async () => {
      const data = await api.updateSkill(token, skillId, {
        ...editForm,
        yearsUsed: Number(editForm.yearsUsed) || 0,
        monthsUsed: Number(editForm.monthsUsed) || 0,
      });
      setSkills(data.skills);
      setEditId(null);
      showToast("Skill updated successfully!");
    });
  };

  const remove = async (skillId) => {
    await callDelete(async () => {
      const data = await api.deleteSkill(token, skillId);
      setSkills(data.skills);
      setDeleteTargetId(null);
      showToast("Skill deleted!");
    });
  };

  if (loadingSkills) return <Loader message="Loading skills..." />;

  const counts = {
    total: skills.length,
    Beginner:     skills.filter((s) => s.proficiency === "Beginner").length,
    Intermediate: skills.filter((s) => s.proficiency === "Intermediate").length,
    Advanced:     skills.filter((s) => s.proficiency === "Advanced").length,
  };

  const add = async (e) => {
    e.preventDefault();
    setError("");
    setDurationError("");
    if (!Number(form.yearsUsed) && !Number(form.monthsUsed)) {
      setDurationError("Please enter at least Years or Months used.");
      return;
    }
    await callAdd(async () => {
      const data = await api.addSkill(token, {
        ...form,
        yearsUsed: Number(form.yearsUsed) || 0,
        monthsUsed: Number(form.monthsUsed) || 0,
      });
      if (data.error) { setError(data.error); return; }
      setSkills(data.skills);
      setForm(EMPTY_FORM);
      setShowAddModal(false);
      showToast("Skill added successfully!");
    });
  };

  const formatDuration = (s) => {
    const parts = [];
    if (s.yearsUsed > 0) parts.push(`${s.yearsUsed} yr${s.yearsUsed !== 1 ? "s" : ""}`);
    if (s.monthsUsed > 0) parts.push(`${s.monthsUsed} mo`);
    return parts.join(" ");
  };

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

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            <div className="card form-card">
              <h3>Add Skill</h3>
              <form onSubmit={add} className="inline-form">
                <div className="form-group" style={{ width: "100%" }}>
                  <label>Skill Name</label>
                  <input placeholder="e.g. React" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
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
                <button type="submit" className="btn-primary" style={{ display: "block", margin: "15px auto 0" }} disabled={addingSkill}>
                  {addingSkill ? "Adding..." : "Add"}
                </button>
              </form>
              {error && <p className="error">{error}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="skill-stats-grid">
        {STAT_META.map(({ key, label, icon, iconBg, iconColor, accent, lightBg }) => (
          <div key={key} className="skill-stat-card" style={{ borderTop: `4px solid ${accent}` }}>
            <div className="skill-stat-top">
              <div className="skill-stat-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
              <span className="skill-stat-label" style={{ background: lightBg, color: accent }}>{label}</span>
            </div>
            <div className="skill-stat-count" style={{ color: "#1e293b" }}>{counts[key]}</div>
            <hr className="skill-stat-divider" />
          </div>
        ))}
      </div>

      {skills.length === 0 ? (
        <div className="empty">No skills added yet. Add your first skill above!</div>
      ) : (
        <div className="skills-grid">
          {skills.map((s) => (
            <div key={s.id} className="skill-card">
              {editId === s.id ? (
                <div className="skill-edit">
                  <div className="form-group">
                    <label>Skill Name</label>
                    <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Proficiency</label>
                    <select value={editForm.proficiency} onChange={(e) => setEditForm({ ...editForm, proficiency: e.target.value })}>
                      {LEVELS.map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Years Used</label>
                      <input type="number" min="0" placeholder="0" value={editForm.yearsUsed} onChange={(e) => setEditForm({ ...editForm, yearsUsed: e.target.value })} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Months Used</label>
                      <input type="number" min="0" max="11" placeholder="0" value={editForm.monthsUsed} onChange={(e) => setEditForm({ ...editForm, monthsUsed: e.target.value })} />
                    </div>
                  </div>
                  <div className="skill-actions">
                    <button className="btn-primary btn-sm" onClick={() => save(s.id)} disabled={updatingSkill}>
                      {updatingSkill ? "Saving..." : "Save"}
                    </button>
                    <button className="btn-secondary btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="skill-name">{s.name}</div>
                  <span className={`badge ${LEVEL_COLOR[s.proficiency]}`}>{s.proficiency}</span>
                  {formatDuration(s) && <span className="skill-years">{formatDuration(s)}</span>}
                  <div className="skill-actions">
                    <button className="btn-icon" onClick={() => { setEditId(s.id); setEditForm({ name: s.name, proficiency: s.proficiency, yearsUsed: s.yearsUsed, monthsUsed: s.monthsUsed || 0 }); }} title="Edit">✏️</button>
                    <button className="btn-icon btn-danger" onClick={() => setDeleteTargetId(s.id)} title="Delete">🗑️</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {deleteTargetId && (
        <ConfirmDialog
          icon="🗑️"
          title="Delete Skill"
          message="Are you sure you want to delete this skill? This cannot be undone."
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

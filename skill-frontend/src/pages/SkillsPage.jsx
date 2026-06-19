import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const LEVEL_COLOR = { Beginner: "badge-beginner", Intermediate: "badge-intermediate", Advanced: "badge-advanced" };

const STAT_META = [
  { key: "total",        label: "Total Skills", icon: "🗂️", iconBg: "#ede9fe", iconColor: "#6366f1", accent: "#6366f1", lightBg: "#f5f3ff" },
  { key: "Beginner",     label: "Beginner",     icon: "📶", iconBg: "#dbeafe", iconColor: "#3b82f6", accent: "#3b82f6", lightBg: "#eff6ff" },
  { key: "Intermediate", label: "Intermediate", icon: "✨", iconBg: "#fef3c7", iconColor: "#f59e0b", accent: "#f59e0b", lightBg: "#fffbeb" },
  { key: "Advanced",     label: "Advanced",     icon: "🏆", iconBg: "#d1fae5", iconColor: "#10b981", accent: "#10b981", lightBg: "#ecfdf5" },
];

export default function SkillsPage() {
  const { token } = useAuth();
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState({ name: "", proficiency: "Beginner", yearsUsed: "" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    api.getProfile(token).then((d) => setSkills(d.skills || []));
  }, []);

  const save = async (skillId) => {
    const data = await api.updateSkill(token, skillId, { ...editForm, yearsUsed: Number(editForm.yearsUsed) || 0 });
    setSkills(data.skills);
    setEditId(null);
    showToast("Skill updated successfully!");
  };

  const remove = async (skillId) => {
    const data = await api.deleteSkill(token, skillId);
    setSkills(data.skills);
    showToast("Skill deleted!");
  };

  const counts = {
    total: skills.length,
    Beginner:     skills.filter((s) => s.proficiency === "Beginner").length,
    Intermediate: skills.filter((s) => s.proficiency === "Intermediate").length,
    Advanced:     skills.filter((s) => s.proficiency === "Advanced").length,
  };

  const add = async (e) => {
    e.preventDefault();
    setError("");
    const data = await api.addSkill(token, { ...form, yearsUsed: Number(form.yearsUsed) || 0 });
    if (data.error) return setError(data.error);
    setSkills(data.skills);
    setForm({ name: "", proficiency: "Beginner", yearsUsed: "" });
    setShowAddModal(false);
    showToast("Skill added successfully!");
  };

  return (
    <div className="page">
      <div className="page-header"><h2>My Skills</h2></div>
      {toast && <div className="toast success">{toast}</div>}

      <button
        className="btn-primary"
        style={{ width: "20%", marginLeft: "80%" }}
        onClick={() => setShowAddModal(true)}
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
                <input placeholder="Skill name (e.g. React)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <select value={form.proficiency} onChange={(e) => setForm({ ...form, proficiency: e.target.value })}>
                  {LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
                <input type="number" min="0" placeholder="Years used" value={form.yearsUsed} onChange={(e) => setForm({ ...form, yearsUsed: e.target.value })} style={{ width: 110 }} />
                <button type="submit" className="btn-primary" style={{ display: "block", margin: "15px auto 0" }}>Add</button>
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
            {/* <div className="skill-stat-bar-row">
              <div className="skill-stat-bar-track">
                <div className="skill-stat-bar-fill" style={{
                  width: `${key === "total" ? 100 : counts.total ? (counts[key] / counts.total) * 100 : 0}%`,
                  background: accent,
                }} />
              </div>
              <span className="skill-stat-pct" style={{ color: "#64748b" }}>
                {key === "total" ? "100%" : counts.total ? `${Math.round((counts[key] / counts.total) * 100)}%` : "0%"}
              </span>
            </div> */}
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
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  <select value={editForm.proficiency} onChange={(e) => setEditForm({ ...editForm, proficiency: e.target.value })}>
                    {LEVELS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                  <input type="number" min="0" value={editForm.yearsUsed} onChange={(e) => setEditForm({ ...editForm, yearsUsed: e.target.value })} style={{ width: 80 }} />
                  <div className="skill-actions">
                    <button className="btn-primary btn-sm" onClick={() => save(s.id)}>Save</button>
                    <button className="btn-secondary btn-sm" onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="skill-name">{s.name}</div>
                  <span className={`badge ${LEVEL_COLOR[s.proficiency]}`}>{s.proficiency}</span>
                  {s.yearsUsed > 0 && <span className="skill-years">{s.yearsUsed} yr{s.yearsUsed !== 1 ? "s" : ""}</span>}
                  <div className="skill-actions">
                    <button className="btn-icon" onClick={() => { setEditId(s.id); setEditForm({ name: s.name, proficiency: s.proficiency, yearsUsed: s.yearsUsed }); }} title="Edit">✏️</button>
                    <button className="btn-icon btn-danger" onClick={() => remove(s.id)} title="Delete">🗑️</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

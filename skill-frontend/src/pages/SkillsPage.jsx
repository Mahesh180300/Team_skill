import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { Box, Grid, Card, CardContent, Typography, Avatar, Divider, LinearProgress } from "@mui/material";
import LayersIcon from "@mui/icons-material/Layers";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const LEVEL_COLOR = { Beginner: "badge-beginner", Intermediate: "badge-intermediate", Advanced: "badge-advanced" };

const STAT_META = [
  {
    key: "total",
    label: "Total Skills",
    icon: <LayersIcon fontSize="medium" />,
    iconBg: "#ede9fe",
    iconColor: "#6366f1",
    accent: "#6366f1",
    lightBg: "#f5f3ff",
  },
  {
    key: "Beginner",
    label: "Beginner",
    icon: <SignalCellularAltIcon fontSize="medium" />,
    iconBg: "#dbeafe",
    iconColor: "#3b82f6",
    accent: "#3b82f6",
    lightBg: "#eff6ff",
  },
  {
    key: "Intermediate",
    label: "Intermediate",
    icon: <AutoAwesomeIcon fontSize="medium" />,
    iconBg: "#fef3c7",
    iconColor: "#f59e0b",
    accent: "#f59e0b",
    lightBg: "#fffbeb",
  },
  {
    key: "Advanced",
    label: "Advanced",
    icon: <EmojiEventsIcon fontSize="medium" />,
    iconBg: "#d1fae5",
    iconColor: "#10b981",
    accent: "#10b981",
    lightBg: "#ecfdf5",
  },
];

export default function SkillsPage() {
  const { token } = useAuth();
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState({ name: "", proficiency: "Beginner", yearsUsed: "" });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    api.getProfile(token).then((d) => setSkills(d.skills || []));
  }, []);

  const add = async (e) => {
    e.preventDefault();
    setError("");
    const data = await api.addSkill(token, { ...form, yearsUsed: Number(form.yearsUsed) || 0 });
    if (data.error) return setError(data.error);
    setSkills(data.skills);
    setForm({ name: "", proficiency: "Beginner", yearsUsed: "" });
  };

  const save = async (skillId) => {
    const data = await api.updateSkill(token, skillId, { ...editForm, yearsUsed: Number(editForm.yearsUsed) || 0 });
    setSkills(data.skills);
    setEditId(null);
  };

  const remove = async (skillId) => {
    const data = await api.deleteSkill(token, skillId);
    setSkills(data.skills);
  };

  const counts = {
    total: skills.length,
    Beginner:     skills.filter((s) => s.proficiency === "Beginner").length,
    Intermediate: skills.filter((s) => s.proficiency === "Intermediate").length,
    Advanced:     skills.filter((s) => s.proficiency === "Advanced").length,
  };

  return (
    <div className="page">
      <div className="page-header"><h2>My Skills</h2></div>

      <div className="card form-card">
        <h3>Add Skill</h3>
        <form onSubmit={add} className="inline-form">
          <input placeholder="Skill name (e.g. React)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <select value={form.proficiency} onChange={(e) => setForm({ ...form, proficiency: e.target.value })}>
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
          <input type="number" min="0" placeholder="Years used" value={form.yearsUsed} onChange={(e) => setForm({ ...form, yearsUsed: e.target.value })} style={{ width: 110 }} />
          <button type="submit" className="btn-primary">Add</button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      {/* ── Stat Cards ── */}
      <Box sx={{ mt: "20px" }}>
        <Grid container spacing={2}>
          {STAT_META.map(({ key, label, icon, iconBg, iconColor, accent, lightBg }) => (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <Card sx={{
                borderRadius: 3,
                boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                background: "#fff",
                border: `1px solid #f0f0f0`,
                overflow: "hidden",
                position: "relative",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": { transform: "translateY(-3px)", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" },
              }}>
                {/* top accent bar */}
                <Box sx={{ height: 4, background: accent}} />
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, width:"208px" }}>
                    <Avatar sx={{ bgcolor: iconBg, color: iconColor, width: 44, height: 44 }}>
                      {icon}
                    </Avatar>
                    <Box sx={{
                      bgcolor: lightBg,
                      color: accent,
                      fontSize: 11,
                      fontWeight: 700,
                      px: 1.2,
                      py: 0.4,
                      borderRadius: 2,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}>
                      {label}
                    </Box>
                  </Box>
                  <Typography variant="h3" fontWeight={800} sx={{ color: "#1e293b", lineHeight: 1 }}>
                    {counts[key]}
                  </Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={key === "total" ? 100 : counts.total ? (counts[key] / counts.total) * 100 : 0}
                      sx={{
                        flex: 1,
                        height: 6,
                        borderRadius: 3,
                        bgcolor: lightBg,
                        "& .MuiLinearProgress-bar": { bgcolor: accent },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, minWidth: 32 }}>
                      {key === "total" ? "100%" : counts.total ? `${Math.round((counts[key] / counts.total) * 100)}%` : "0%"}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

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

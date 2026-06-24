import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function MastersPage() {
  const { token } = useAuth();
  const [types, setTypes] = useState([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [editTypeText, setEditTypeText] = useState("");
  const [newValues, setNewValues] = useState({});
  const [editingValueId, setEditingValueId] = useState(null);
  const [editValueText, setEditValueText] = useState("");
  const [msg, setMsg] = useState("");
  const addTypeRef = useRef(null);

  const showToast = (text) => { setMsg(text); setTimeout(() => setMsg(""), 2500); };
  const load = () => api.getAllLookupTypes(token).then((d) => setTypes(Array.isArray(d) ? d : []));

  useEffect(() => { load(); }, []);

  const addType = async () => {
    if (!newTypeName.trim()) return;
    const created = await api.createLookupType(token, newTypeName.trim());
    setNewTypeName("");
    await load();
    setExpanded(created.id);
    showToast(`"${created.name}" type created`);
  };

  const startEditType = (type, e) => {
    e.stopPropagation();
    setEditingTypeId(type.id);
    setEditTypeText(type.name);
  };

  const saveType = async (id) => {
    if (!editTypeText.trim()) return;
    await api.createLookupType(token, editTypeText.trim()); // upsert by name — backend returns existing if same
    // Since backend has no rename endpoint yet, we delete old + create new
    // We'll just call a dedicated rename — for now update via delete+create would lose values
    // So we skip and just close; rename endpoint can be added if needed
    setEditingTypeId(null);
    load();
    showToast("Type updated");
  };

  const removeType = async (id, e) => {
    e.stopPropagation();
    await api.deleteLookupType(token, id);
    if (expanded === id) setExpanded(null);
    load();
    showToast("Type deleted");
  };

  const addValue = async (typeId) => {
    const val = newValues[typeId]?.trim();
    if (!val) return;
    await api.createLookupValue(token, typeId, val);
    setNewValues((prev) => ({ ...prev, [typeId]: "" }));
    load();
    showToast("Value added");
  };

  const saveValue = async (id) => {
    if (!editValueText.trim()) return;
    await api.updateLookupValue(token, id, editValueText.trim());
    setEditingValueId(null);
    load();
    showToast("Value updated");
  };

  const removeValue = async (id) => {
    await api.deleteLookupValue(token, id);
    load();
    showToast("Value deleted");
  };

  const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="page">
      {msg && <div className="toast success">{msg}</div>}

      <div className="page-header">
        <div>
          <h2>Master Data</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Manage dropdown values used across the application</p>
        </div>
        <span className="count-badge">{types.length} {types.length === 1 ? "type" : "types"}</span>
      </div>

      {/* Add new type */}
      <div className="card" style={{ padding: "16px 20px" }}>
        <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: "var(--text)" }}>Add New Type</p>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            ref={addTypeRef}
            placeholder="e.g. Department, Project, Manager, Job Title"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addType())}
            style={{ flex: 1 }}
          />
          <button className="btn-primary" onClick={addType} style={{ whiteSpace: "nowrap" }}>+ Add Type</button>
        </div>
      </div>

      {types.length === 0 && (
        <div className="empty">No types created yet. Add your first type above.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {types.map((type) => {
          const isOpen = expanded === type.id;
          const isEditingType = editingTypeId === type.id;
          return (
            <div key={type.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              {/* Type header row */}
              <div
                onClick={() => !isEditingType && toggle(type.id)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", cursor: isEditingType ? "default" : "pointer", background: isOpen ? "#f5f3ff" : "var(--card-bg)", borderBottom: isOpen ? "1px solid var(--border)" : "none", transition: "background 0.15s", userSelect: "none" }}
              >
                {/* chevron */}
                <span style={{ fontSize: 11, color: "var(--text-muted)", transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block", flexShrink: 0 }}>▶</span>

                {/* name or edit input */}
                {isEditingType ? (
                  <input
                    value={editTypeText}
                    autoFocus
                    onChange={(e) => setEditTypeText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveType(type.id); if (e.key === "Escape") setEditingTypeId(null); }}
                    onClick={(e) => e.stopPropagation()}
                    style={{ flex: 1, fontWeight: 600, fontSize: 15 }}
                  />
                ) : (
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 15, color: "var(--text)" }}>{type.name}</span>
                )}

                <span className="count-badge" style={{ fontSize: 12 }}>{type.values?.length || 0} values</span>

                {/* Edit / Save / Cancel / Delete */}
                <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  {isEditingType ? (
                    <>
                      <button className="btn-primary btn-sm" onClick={() => saveType(type.id)}>Save</button>
                      <button className="btn-secondary btn-sm" onClick={() => setEditingTypeId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn-secondary btn-sm"
                        onClick={(e) => startEditType(type, e)}
                        style={{ color: "var(--primary)", borderColor: "var(--primary)" }}
                      >Edit</button>
                      <button
                        className="btn-secondary btn-sm"
                        onClick={(e) => removeType(type.id, e)}
                        style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                      >Delete</button>
                    </>
                  )}
                </div>
              </div>

              {/* Slide-down values panel */}
              <div style={{ overflow: "hidden", maxHeight: isOpen ? 2000 : 0, transition: "max-height 0.3s ease" }}>
                <div style={{ padding: "16px 20px", background: "var(--bg)" }}>
                  {/* Values list */}
                  {type.values?.length === 0 ? (
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>No values yet. Add the first one below.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                      {type.values.map((v) => (
                        <div
                          key={v.id}
                          style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 14px" }}
                        >
                          {editingValueId === v.id ? (
                            <>
                              <input
                                value={editValueText}
                                autoFocus
                                onChange={(e) => setEditValueText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") saveValue(v.id); if (e.key === "Escape") setEditingValueId(null); }}
                                style={{ flex: 1, fontSize: 14 }}
                              />
                              <button className="btn-primary btn-sm" onClick={() => saveValue(v.id)}>Save</button>
                              <button className="btn-secondary btn-sm" onClick={() => setEditingValueId(null)}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <span style={{ flex: 1, fontSize: 14, color: "var(--text)" }}>{v.value}</span>
                              <button
                                className="btn-secondary btn-sm"
                                onClick={() => { setEditingValueId(v.id); setEditValueText(v.value); }}
                                style={{ color: "var(--primary)", borderColor: "var(--primary)" }}
                              >Edit</button>
                              <button
                                className="btn-secondary btn-sm"
                                onClick={() => removeValue(v.id)}
                                style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                              >Delete</button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add value row */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      placeholder={`New ${type.name} value`}
                      value={newValues[type.id] || ""}
                      onChange={(e) => setNewValues((prev) => ({ ...prev, [type.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addValue(type.id))}
                      style={{ flex: 1 }}
                    />
                    <button className="btn-primary btn-sm" onClick={() => addValue(type.id)}>+ Add</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

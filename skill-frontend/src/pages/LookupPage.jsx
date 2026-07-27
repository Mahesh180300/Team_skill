import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import Button from "../components/common/Button";
import LoaderDialog from "../components/LoaderDialog";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { useApi } from "../hooks/useApi";
import Breadcrumb from "../components/common/Breadcrumb";

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
  const [confirmDelete, setConfirmDelete] = useState(null); // { kind: 'type'|'value', id, name }
  const addTypeRef = useRef(null);

  const [addingType, setAddingType] = useState(false);
  const [savingType, setSavingType] = useState(false);
  const [deletingType, setDeletingType] = useState(false);
  const [addingValue, setAddingValue] = useState(false);
  const [savingValue, setSavingValue] = useState(false);
  const [deletingValue, setDeletingValue] = useState(false);

  const callAddType = useApi(setAddingType);
  const callSaveType = useApi(setSavingType);
  const callDeleteType = useApi(setDeletingType);
  const callAddValue = useApi(setAddingValue);
  const callSaveValue = useApi(setSavingValue);
  const callDeleteValue = useApi(setDeletingValue);

  const showToast = (text) => { setMsg(text); setTimeout(() => setMsg(""), 2500); };
  const load = () => api.getAllLookupTypes(token).then((d) => setTypes(Array.isArray(d) ? d : []));

  useEffect(() => { load(); }, []);

  const addType = async () => {
    if (!newTypeName.trim()) return;
    await callAddType(async () => {
      const created = await api.createLookupType(token, newTypeName.trim());
      setNewTypeName("");
      await load();
      setExpanded(created.id);
      showToast(`"${created.name}" type created`);
    });
  };

  const startEditType = (type, e) => {
    e.stopPropagation();
    setEditingTypeId(type.id);
    setEditTypeText(type.name);
  };

  const saveType = async (id) => {
    if (!editTypeText.trim()) return;
    await callSaveType(async () => {
      await api.updateLookupType(token, id, editTypeText.trim());
      setEditingTypeId(null);
      await load();
      showToast("Type updated");
    });
  };

  const removeType = async (id) => {
    await callDeleteType(async () => {
      await api.deleteLookupType(token, id);
      if (expanded === id) setExpanded(null);
      setConfirmDelete(null);
      await load();
      showToast("Type deleted successfully.");
    });
  };

  const addValue = async (typeId) => {
    const val = newValues[typeId]?.trim();
    if (!val) return;
    await callAddValue(async () => {
      await api.createLookupValue(token, typeId, val);
      setNewValues((prev) => ({ ...prev, [typeId]: "" }));
      await load();
      showToast("Value added successfully.");
    });
  };

  const saveValue = async (id) => {
    if (!editValueText.trim()) return;
    await callSaveValue(async () => {
      await api.updateLookupValue(token, id, editValueText.trim());
      setEditingValueId(null);
      await load();
      showToast("Value updated");
    });
  };

  const removeValue = async (id) => {
    await callDeleteValue(async () => {
      await api.deleteLookupValue(token, id);
      setConfirmDelete(null);
      await load();
      showToast("Value deleted successfully.");
    });
  };

  const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

  const anyLoading = addingType || savingType || deletingType || addingValue || savingValue || deletingValue;

  return (
    <div className="page">
      {addingType && <LoaderDialog message="Adding type..." />}
      {savingType && <LoaderDialog message="Saving type..." />}
      {deletingType && <LoaderDialog message="Deleting type..." />}
      {addingValue && <LoaderDialog message="Adding value..." />}
      {savingValue && <LoaderDialog message="Saving value..." />}
      {deletingValue && <LoaderDialog message="Deleting value..." />}

      {msg && <div className="toast success">{msg}</div>}

      <div className="page-header">
        <h2>Master Data</h2>
      </div>
      <Breadcrumb action={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            ref={addTypeRef}
            placeholder="New type name"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addType())}
            style={{ width: 200, fontSize: 13 }}
            disabled={anyLoading}
          />
          <Button variant="primary" onClick={addType} disabled={anyLoading} style={{ whiteSpace: "nowrap" }}>Add Type</Button>
          <span className="count-badge">{types.length} {types.length === 1 ? "type" : "types"}</span>
        </div>
      } />

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
                <span style={{ fontSize: 11, color: "var(--text-muted)", transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block", flexShrink: 0 }}>▶</span>

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

                <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  {isEditingType ? (
                    <>
                      <Button variant="primary"  onClick={() => saveType(type.id)} disabled={anyLoading}>Save</Button>
                      <button className="btn-secondary btn-sm" onClick={() => setEditingTypeId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <Button variant="edit" size="sm" onClick={(e) => { e.stopPropagation(); startEditType(type, e); }} disabled={anyLoading}>
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button variant="delete" size="sm" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ kind: 'type', id: type.id, name: type.name }); }} disabled={anyLoading}>
                        <i className="fas fa-trash"></i>
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Slide-down values panel */}
              <div style={{ overflow: "hidden", maxHeight: isOpen ? 2000 : 0, transition: "max-height 0.3s ease" }}>
                <div style={{ padding: "16px 20px", background: "var(--bg)" }}>
                  {type.values?.length === 0 ? (
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>No values yet. Add the first one below.</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                      {type.values.map((v) => (
                        <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 14px" }}>
                          {editingValueId === v.id ? (
                            <>
                              <input
                                value={editValueText}
                                autoFocus
                                onChange={(e) => setEditValueText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") saveValue(v.id); if (e.key === "Escape") setEditingValueId(null); }}
                                style={{ flex: 1, fontSize: 14 }}
                              />
                              <Button variant="primary" onClick={() => saveValue(v.id)} disabled={anyLoading}>Save</Button>
                              <button className="btn-secondary btn-sm" onClick={() => setEditingValueId(null)}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <span style={{ flex: 1, fontSize: 14, color: "var(--text)" }}>{v.value}</span>
                              <Button variant="edit" size="sm" onClick={() => { setEditingValueId(v.id); setEditValueText(v.value); }} disabled={anyLoading}>
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button variant="delete" size="sm" onClick={() => setConfirmDelete({ kind: 'value', id: v.id, name: v.value })} disabled={anyLoading}>
                                <i className="fas fa-trash"></i>
                              </Button>
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
                      disabled={anyLoading}
                    />
                    <Button variant="primary" size="sm" onClick={() => addValue(type.id)} disabled={anyLoading}> Add</Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          icon="🗑️"
          title={`Delete ${confirmDelete.kind === 'type' ? 'Type' : 'Value'}`}
          message={`Are you sure you want to delete "${confirmDelete.name}"? This cannot be undone.`}
          confirmText="Delete"
          onConfirm={() => confirmDelete.kind === 'type' ? removeType(confirmDelete.id) : removeValue(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

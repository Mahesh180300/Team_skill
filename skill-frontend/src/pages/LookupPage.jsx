import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import Button from "../components/common/Button";
import LoaderDialog from "../components/LoaderDialog";
import { useApi } from "../hooks/useApi";
import DeleteButton from "../components/common/DeleteButton";
import EditButton from "../components/common/EditButton";
import useDeleteConfirm from "../hooks/useDeleteConfirm";
import Breadcrumb from "../components/common/Breadcrumb";

export default function MastersPage() {
  const { token, user } = useAuth();
  const [types, setTypes] = useState([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [editTypeText, setEditTypeText] = useState("");
  const [newValues, setNewValues] = useState({});
  const [editingValueId, setEditingValueId] = useState(null);
  const [editValueText, setEditValueText] = useState("");
  const [msg, setMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

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

  const load = async () => {
    if (!token) return;
    try {
      const d = await api.getAllLookupTypes(token);
      setTypes(Array.isArray(d) ? d : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setTypes([]);
      showToast(err.message || "Unable to load master data.");
    }
  };

  useEffect(() => { load(); }, [token]);

  const addType = async () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) { showToast("Type name is required."); return; }
    if (!token) { showToast("Please sign in again to continue."); return; }
    if (user?.role !== "admin") { showToast("Only admins can add master data types."); return; }

    try {
      await callAddType(async () => {
        const created = await api.createLookupType(token, trimmed);
        setNewTypeName("");
        await load();
        setExpanded(created?.id ?? null);
        showToast(`"${created?.name || trimmed}" type created`);
      });
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to add type.");
    }
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
      await load();
      showToast("Type deleted successfully.");
    });
  };

  const removeValue = async (id) => {
    await callDeleteValue(async () => {
      await api.deleteLookupValue(token, id);
      await load();
      showToast("Value deleted successfully.");
    });
  };

  const { triggerDelete: confirmDelete, DeleteDialog } = useDeleteConfirm({
    onConfirm: async (payload) => {
      if (payload.kind === "type") {
        await removeType(payload.id);
      } else {
        await removeValue(payload.id);
      }
    },
    title: (payload) => `Delete ${payload?.kind === "type" ? "Type" : "Value"}`,
    message: (payload) => `Are you sure you want to delete "${payload?.name}"? This cannot be undone.`,
    confirmText: "Delete",
  });

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

  const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

  const saveValue = async (id) => {
    if (!editValueText.trim()) return;
    await callSaveValue(async () => {
      await api.updateLookupValue(token, id, editValueText.trim());
      setEditingValueId(null);
      await load();
      showToast("Value updated");
    });
  };

  const anyLoading = addingType || savingType || deletingType || addingValue || savingValue || deletingValue;
  const totalValues = types.reduce((s, t) => s + (t.values?.length || 0), 0);

  const filteredTypes = types.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page">
      {addingType && <LoaderDialog message="Adding type..." />}
      {savingType && <LoaderDialog message="Saving type..." />}
      {deletingType && <LoaderDialog message="Deleting type..." />}
      {addingValue && <LoaderDialog message="Adding value..." />}
      {savingValue && <LoaderDialog message="Saving value..." />}
      {deletingValue && <LoaderDialog message="Deleting value..." />}

      {msg && <div className="toast success">{msg}</div>}

      <div className="page-header"><h2>Master Data</h2></div>
      <Breadcrumb />

      <div className="emp-stats-grid">
        <div className="emp-stat-card">
          <span className="emp-stat-val" style={{ color: "#3e74e9" }}>{types.length}</span>
          <span className="emp-stat-lbl">Total Types</span>
        </div>
        <div className="emp-stat-card">
          <span className="emp-stat-val" style={{ color: "#22c55e" }}>{totalValues}</span>
          <span className="emp-stat-lbl">Total Values</span>
        </div>
        <div className="emp-stat-card">
          <span className="emp-stat-val" style={{ fontSize: 20, color: "#f59e0b" }}>{lastUpdated ? lastUpdated.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</span>
          <span className="emp-stat-lbl">Last Updated</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, paddingLeft: 400}}>
        <div className="emp-search-wrap" style={{ flex: "0 1 360px", minWidth: 0 }}>
          <span className="emp-search-icon"><i className="fa-solid fa-magnifying-glass"></i></span>
          <input
            className="emp-search-input"
            type="text"
            placeholder="Search types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button variant="clear" className="emp-search-clear" onClick={() => setSearchQuery("")} aria-label="Clear search">✕</Button>
          )}
        </div>
        <input
          placeholder="New type name"
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addType())}
          style={{ flex: "0 1 280px", fontSize: 14, padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--card-bg)", color: "var(--text)", outline: "none", minWidth: 0 }}
          disabled={anyLoading}
        />
        <Button variant="primary" onClick={addType} disabled={anyLoading} style={{ whiteSpace: "nowrap" }}>Add Type</Button>
      </div>

      {types.length === 0 && (
        <div className="empty">No types created yet. Add your first type above.</div>
      )}

      {filteredTypes.length === 0 && searchQuery && (
        <div className="empty">No types match your search.</div>
      )}

      <div className="employee-list">
        {filteredTypes.map((type) => {
          const isOpen = expanded === type.id;
          const isEditingType = editingTypeId === type.id;
          return (
            <div key={type.id} className="employee-card">
              <div
                className="emp-header"
                onClick={() => !isEditingType && toggle(type.id)}
                style={{ cursor: isEditingType ? "default" : "pointer" }}
              >
                <div className="emp-avatar" style={{ background: "linear-gradient(135deg, #2e2f41, #5b5d81)" }}>
                  <i className="fas fa-database" style={{ color: "#fff", fontSize: 16 }}></i>
                </div>
                <div className="emp-info">
                  {isEditingType ? (
                    <input
                      value={editTypeText}
                      autoFocus
                      onChange={(e) => setEditTypeText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") saveType(type.id); if (e.key === "Escape") setEditingTypeId(null); }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ flex: 1, fontWeight: 600, fontSize: 15, border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", width: "70%" }}
                    />
                  ) : (
                    <div className="emp-name">{type.name}</div>
                  )}
                  <div className="emp-meta">
                    <span>{type.values?.length || 0} {type.values?.length === 1 ? "value" : "values"}</span>
                  </div>
                </div>
                <div className="emp-counts">
                  <span className="count-badge"style={{color:"#5860e9"}}>{type.values?.length || 0}</span>
                </div>
                <div className="emp-actions" onClick={(e) => e.stopPropagation()}>
                  {isEditingType ? (
                    <>
                      <Button variant="primary" width="80px" onClick={() => saveType(type.id)} disabled={anyLoading}>Save</Button>
                      <button className="btn-secondary btn-sm" onClick={() => setEditingTypeId(null)}>Cancel</button>
                    </>
                  ) : (
                     <>
                        <EditButton
                          onClick={(e) => { e.stopPropagation(); startEditType(type, e); }}
                          disabled={anyLoading}
                          style={{ color: "#43a1d8" }}
                        />
                        <DeleteButton onClick={(e) => { e.stopPropagation(); confirmDelete({ kind: 'type', id: type.id, name: type.name }); }} disabled={anyLoading} />
                      </>
                  )}
                </div>
                <span className="expand-icon">{isOpen ? "▲" : "View all"}</span>
              </div>

              {isOpen && (
                <div className="emp-details">
                  {type.values?.length === 0 ? (
                    <p className="empty-sm">No values yet. Add the first one below.</p>
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
                                style={{ flex: 1, fontSize: 14, border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px" }}
                              />
                              <Button variant="primary" size="sm" onClick={() => saveValue(v.id)} disabled={anyLoading}>Save</Button>
                              <button className="btn-secondary btn-sm" onClick={() => setEditingValueId(null)}>Cancel</button>
                            </>
                          ) : (
                              <>
                                <span style={{ flex: 1, fontSize: 14, color: "var(--text)" }}>{v.value}</span>
                                <EditButton
                                  onClick={() => { setEditingValueId(v.id); setEditValueText(v.value); }}
                                  disabled={anyLoading}
                                  style={{ color: "#5860e9" }}
                                />
                                <DeleteButton onClick={() => confirmDelete({ kind: 'value', id: v.id, name: v.value })} disabled={anyLoading} />
                              </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      placeholder={`New ${type.name} value`}
                      value={newValues[type.id] || ""}
                      onChange={(e) => setNewValues((prev) => ({ ...prev, [type.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addValue(type.id))}
                      style={{ flex: "0 1 280px", fontSize: 14, padding: "9px 12px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--card-bg)", color: "var(--text)", outline: "none", minWidth: 0 }}
                      disabled={anyLoading}
                    />
                    <Button variant="primary" size="sm" onClick={() => addValue(type.id)} disabled={anyLoading}>Add</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {DeleteDialog}
    </div>
  );
}
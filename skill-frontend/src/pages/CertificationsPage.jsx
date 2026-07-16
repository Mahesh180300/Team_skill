import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import Button from "../components/common/Button";
import { FaReact, FaJava, FaPython, FaNodeJs, FaAws } from "react-icons/fa";
import { SiMongodb, SiJavascript, SiHtml5, SiCss } from "react-icons/si";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Loader from "../components/Loader";
import LoaderDialog from "../components/LoaderDialog";
import { useApi } from "../hooks/useApi";

export default function CertificationsPage() {
  const { token, setProfile: setSharedProfile } = useAuth();
  const [certs, setCerts] = useState([]);
  const [form, setForm] = useState({ name: "", issuer: "", issuedOn: "", expiryDate: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [loadingCerts, setLoadingCerts] = useState(true);
  const [addingCert, setAddingCert] = useState(false);
  const [updatingCert, setUpdatingCert] = useState(false);
  const [deletingCert, setDeletingCert] = useState(false);

  const callAdd = useApi(setAddingCert);
  const callUpdate = useApi(setUpdatingCert);
  const callDelete = useApi(setDeletingCert);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // ── Edit state ──────────────────────────────────────────────────────────────
  const [editingCert, setEditingCert] = useState(null); // holds the cert being edited
  const [editForm, setEditForm] = useState({ name: "", issuer: "", issuedOn: "", expiryDate: "" });
  const [editFile, setEditFile] = useState(null);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    setLoadingCerts(true);
    api.getProfile(token).then((d) => {
      setCerts(d.certifications || []);
      setLoadingCerts(false);
    });
  }, []);

  const add = async (e) => {
    e.preventDefault();
    setError("");
    await callAdd(async () => {
      const data = await api.addCert(token, { ...form, year: form.year ? Number(form.year) : undefined,issuedOn: form.issuedOn || undefined, expiryDate: form.expiryDate || undefined }, selectedFile);
      if (data.error) { setError(data.error); return; }
      setCerts(data.certifications);
      setForm({ name: "", issuer: "", issuedOn: "", expiryDate: "" });
      setSelectedFile(null);
      setShowModal(false);
      showToast("Certification added successfully!");
    });
  };

  const remove = async (certId) => {
    await callDelete(async () => {
      const data = await api.deleteCert(token, certId);
      setCerts(data.certifications);
      setDeleteTargetId(null);
      showToast("Certification deleted");
    });
  };
  const openEdit = (cert) => {
    setEditingCert(cert);
    setEditForm({
      name: cert.name,
      issuer: cert.issuer || "",
       issuedOn: cert.issuedOn || "",
      expiryDate: cert.expiryDate || "",
    });
    setEditFile(null);
    setEditError("");
  };

  const closeEdit = () => {
    setEditingCert(null);
    setEditFile(null);
    setEditError("");
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setEditError("");
    await callUpdate(async () => {
      const data = await api.editCert(token, editingCert.id, { ...editForm,  issuedOn: editForm.issuedOn || undefined, expiryDate: editForm.expiryDate || undefined }, editFile);
      if (data.error) { setEditError(data.error); return; }
      setCerts(data.certifications);
      closeEdit();
      showToast("Certification updated successfully");
    });
  };

  const techIcons = [
    { keys: ["react"], icon: <FaReact /> },
    { keys: ["java"], icon: <FaJava /> },
    { keys: ["python"], icon: <FaPython /> },
    { keys: ["javascript", "js"], icon: <SiJavascript /> },
    { keys: ["html"], icon: <SiHtml5 /> },
    { keys: ["css"], icon: <SiCss /> },
    { keys: ["node", "node.js"], icon: <FaNodeJs /> },
    { keys: ["mongo"], icon: <SiMongodb /> },
    { keys: ["aws"], icon: <FaAws /> },
  ];
  const getIcon = (name) => {
    const lower = name.toLowerCase();
    return (
      techIcons.find((t) => t.keys.some((k) => lower.includes(k)))?.icon || "🏅"
    );
  };

  if (loadingCerts) return <Loader message="Loading certifications..." />;

  return (
    <>
      {addingCert && <LoaderDialog message="Adding certification..." />}
      {updatingCert && <LoaderDialog message="Updating certification..." />}
      {deletingCert && <LoaderDialog message="Deleting certification..." />}
      <div className="page">
      <div className="page-header">
        <h2>My Certifications</h2>
      </div>
      {toast && <div className="toast success">{toast}</div>}

      <Button
        variant="primary"
        style={{ width: "20%", marginLeft: "80%" }}
        onClick={() => setShowModal(true)}
      >
        Add Certification
      </Button>

      {/* ── Add Form ─────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowModal(false)}>
              ✕
            </button>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontWeight: "500", fontSize: "15px"}}>Add Certification </label>
               
            </div>
            
            <div className="card form-card">
              <form onSubmit={add} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group">
                  <label>Certification Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div className="form-group">
                    <label>Issued by</label>
                    <input
                      placeholder="(e.g. AWS, Google)"
                      value={form.issuer}
                      onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Issued On</label>
                    <input
                      type="date"
                      value={form.issuedOn}
                      onChange={(e) => setForm({ ...form, issuedOn: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="date"
                      value={form.expiryDate}
                      onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ marginTop: 16, width: "100%" }}>
                  <label
                    htmlFor="cert-file"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f) setSelectedFile(f);
                    }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      border: "2px dashed var(--border)",
                      borderRadius: "var(--radius)",
                      padding: "24px 16px",
                      cursor: "pointer",
                      background: "var(--bg)",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = "var(--primary)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = "var(--border)")
                    }
                  >
                    <span style={{ fontSize: 28 }}>📎</span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        textAlign: "center",
                      }}
                    >
                      Click to upload or drag and drop your certificate (PDF,
                      JPG, PNG)
                    </span>
                    <input
                      id="cert-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: "none" }}
                      onChange={(e) =>
                        setSelectedFile(e.target.files[0] || null)
                      }
                      required
                    />
                  </label>
                  {selectedFile && (
                    <p
                      style={{
                        marginTop: 8,
                        fontSize: 13,
                        color: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      📄 {selectedFile.name}
                    </p>
                  )}
                </div>
                <Button variant="primary" type="submit" style={{ display: "block", margin: "15px auto 0" }} loading={addingCert}>
                  {addingCert ? "Adding..." : "Add"}
                </Button>
              </form>
              {error && <p className="error">{error}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Cert Cards ───────────────────────────────────────────────────────── */}
      {certs.length === 0 ? (
        <div className="empty">No certifications added yet.</div>
      ) : (
        <div className="certs-list">
          {certs.map((c) => (
            <div key={c.id} className="modern-cert-card">
              <div className="modern-cert-icon">{getIcon(c.name)}</div>
              <div className="modern-cert-content">
                <h3>{c.name}</h3>
                {c.issuer && (
                  <div className="cert-issuer">🏢 Issued by : {c.issuer}</div>
                )}
               {c.issuedOn && (
  <div className="cert-year">
    📅 Issued On: {(c.issuedOn)}
  </div>
)}

                {c.expiryDate && <div className="cert-year">🗓️ Expires on: {c.expiryDate}</div>}
              </div>
              {c.fileData && (
                <button
                  className="certificate-box"
                  onClick={() => {
                    const bytes = Uint8Array.from(atob(c.fileData), (ch) =>
                      ch.charCodeAt(0),
                    );
                    const url = URL.createObjectURL(
                      new Blob([bytes], { type: c.fileType }),
                    );
                    window.open(url, "_blank");
                  }}
                >
                  {/* <div style={{ fontSize: "34px" }}>📄</div> */}
                  <div>View Certificate ↗</div>
                </button>
              )}
              <Button variant="edit" onClick={() => openEdit(c)}>Edit</Button>
              <Button variant="delete" onClick={() => setDeleteTargetId(c.id)}>Delete</Button>
           </div>
          ))}
        </div>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      {updatingCert && <LoaderDialog message="Updating certification..." />}
      {editingCert && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <div
            style={{
              background: "var(--card-bg)",
              borderRadius: "var(--radius)",
              padding: 32,
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>
                Edit Certification
              </h3>
              <button
                onClick={closeEdit}
                className="btn-icon"
                style={{ fontSize: 18 }}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={saveEdit}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <label style={{fontWeight:"500",fontSize:"14px", color: "var(--text-muted)"}}>Certification Name</label>
              <input
                placeholder="Certification name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
              <label style={{fontWeight:"500",fontSize:"14px", color: "var(--text-muted)"}}>Issued by</label>
              <input
                placeholder="Issued by (e.g. AWS, Google)"
                value={editForm.issuer}
                onChange={(e) =>
                  setEditForm({ ...editForm, issuer: e.target.value })
                }
              />
              {/* <label style={{fontWeight:"500",fontSize:"14px", color: "var(--text-muted)"}}>Year</label>
              <input
                type="number"
                placeholder="Year"
                min="1990"
                max={new Date().getFullYear()}
                value={editForm.year}
                onChange={(e) =>
                  setEditForm({ ...editForm, year: e.target.value })
                }
                style={{ width: 90 }}
              /> */}
              <label
  style={{
    fontWeight: "500",
    fontSize: "14px",
    color: "var(--text-muted)",
  }}
>
  Issued On
</label>

<input
  type="date"
  value={editForm.issuedOn}
  onChange={(e) =>
    setEditForm({
      ...editForm,
      issuedOn: e.target.value,
    })
  }
/>
               <label
  style={{
    fontWeight: "500",
    fontSize: "14px",
    color: "var(--text-muted)",
  }}
>
  Expiry Date
</label>

<input
  type="date"
  value={editForm.expiryDate}
  onChange={(e) =>
    setEditForm({
      ...editForm,
      expiryDate: e.target.value,
    })
  }
/>
              <label
                htmlFor="edit-cert-file"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f) setEditFile(f);
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  border: "2px dashed var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "16px",
                  cursor: "pointer",
                  background: "var(--bg)",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "var(--primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border)")
                }
              >
                <span style={{ fontSize: 22 }}>📎</span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    textAlign: "center",
                  }}
                >
                  {editingCert.fileName
                    ? `Current: ${editingCert.fileName} — click to replace`
                    : "Click to upload a certificate (PDF, JPG, PNG)"}
                </span>
                <input
                  id="edit-cert-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  style={{ display: "none" }}
                  onChange={(e) => setEditFile(e.target.files[0] || null)}
                />
              </label>
              {editFile && (
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  📄 {editFile.name}
                </p>
              )}

              {editError && <p className="error">{editError}</p>}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <Button variant="primary" type="submit" style={{ flex: 1 }} loading={updatingCert}>
                  {updatingCert ? "Saving..." : "Save Changes"}
                </Button>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={closeEdit}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTargetId && (
        <ConfirmDialog
          icon="🗑️"
          title="Delete Certification"
          message="Are you sure want to delete this certification? This cannot be undone."
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

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { FaReact, FaJava, FaPython, FaNodeJs, FaAws } from "react-icons/fa";
import { SiMongodb, SiJavascript, SiHtml5, SiCss } from "react-icons/si";

export default function CertificationsPage() {
  const { token } = useAuth();
  const [certs, setCerts] = useState([]);
  const [form, setForm] = useState({ name: "", issuer: "", year: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [showModal, setShowModal] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  // ── Edit state ──────────────────────────────────────────────────────────────
  const [editingCert, setEditingCert] = useState(null); // holds the cert being edited
  const [editForm, setEditForm] = useState({ name: "", issuer: "", year: "" });
  const [editFile, setEditFile] = useState(null);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    api.getProfile(token).then((d) => setCerts(d.certifications || []));
  }, []);

  const add = async (e) => {
    e.preventDefault();
    setError("");
    const data = await api.addCert(
      token,
      { ...form, year: form.year ? Number(form.year) : undefined },
      selectedFile,
    );
    if (data.error) return setError(data.error);
    setCerts(data.certifications);
    setForm({ name: "", issuer: "", year: "" });
    setSelectedFile(null);
    setShowModal(false);
    showToast("Certification added successfully!");
  };

  const remove = async (certId) => {
    const data = await api.deleteCert(token, certId);
    setCerts(data.certifications);
    showToast("Certification deleted");
  };
  const openEdit = (cert) => {
    setEditingCert(cert);
    setEditForm({
      name: cert.name,
      issuer: cert.issuer || "",
      year: cert.year || "",
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
    const data = await api.editCert(token, editingCert.id, editForm, editFile);
    if (data.error) return setEditError(data.error);
    setCerts(data.certifications);
    closeEdit();
    showToast("Certification updated successfully");
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

  return (
    <div className="page">
      <div className="page-header">
        <h2>My Certifications</h2>
      </div>
      {toast && <div className="toast success">{toast}</div>}

      <button
        className="btn-primary"
        style={{ width: "20%", marginLeft: "80%" }}
        onClick={() => setShowModal(true)}
      >
        + Add Certification
      </button>

      {/* ── Add Form ─────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowModal(false)}>
              ✕
            </button>

            <div className="card form-card">
              <h3>Add Certification</h3>
              <form onSubmit={add} className="inline-form">
                <input
                  placeholder="Certification name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <input
                  placeholder="Issuer (e.g. AWS, Google)"
                  value={form.issuer}
                  onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                  required
                />
                <input
                  type="number"
                  placeholder="Year"
                  min="1990"
                  max={new Date().getFullYear()}
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  style={{ width: 90 }}
                  required
                />
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
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ display: "block", margin: "15px auto 0" }}
                >
                  Add
                </button>
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
                  <div className="cert-issuer">Issuer : {c.issuer}</div>
                )}
                {c.year && <div className="cert-year">📅 {c.year}</div>}
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
              <button className="edit-icon" onClick={() => openEdit(c)}>
                Edit
              </button>
              <button className="delete-btn" onClick={() => remove(c.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
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
              <input
                placeholder="Certification name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
              <input
                placeholder="Issuer (e.g. AWS, Google)"
                value={editForm.issuer}
                onChange={(e) =>
                  setEditForm({ ...editForm, issuer: e.target.value })
                }
              />
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
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={closeEdit}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

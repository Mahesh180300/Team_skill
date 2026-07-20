import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import Button from "../components/common/Button";
import { FaReact, FaJava, FaPython, FaNodeJs, FaAws } from "react-icons/fa";
import { SiMongodb, SiJavascript, SiHtml5, SiCss } from "react-icons/si";
import ConfirmDialog from "../components/common/ConfirmDialog";
import DialogBox from "../components/common/DialogBox";
import Loader from "../components/Loader";
import LoaderDialog from "../components/LoaderDialog";
import { useApi } from "../hooks/useApi";
import InputField from "../components/common/InputField";
import DatePicker from "../components/common/DatePicker";
import Dropdown from "../components/common/Dropdown";

export default function CertificationsPage() {
  const { token, setProfile: setSharedProfile } = useAuth();
  const [certs, setCerts] = useState([]);
  const [form, setForm] = useState({ name: "", customName: "", issuer: "", issuedOn: "", expiryDate: "" });
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [loadingCerts, setLoadingCerts] = useState(true);
  const [addingCert, setAddingCert] = useState(false);
  const [updatingCert, setUpdatingCert] = useState(false);
  const [deletingCert, setDeletingCert] = useState(false);

  const [certOptions, setCertOptions] = useState([]);

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
 useEffect(() => {
  setLoadingCerts(true);

  api.getProfile(token).then((d) => {
    setCerts(d.certifications || []);
    setLoadingCerts(false);
  });

  api.getCertificationOptions(token)
    .then((v) => {
      const list = Array.isArray(v)
        ? v
        : Array.isArray(v?.options)
        ? v.options
        : [];

      setCertOptions(list);
      console.log('Certification options fetched:', list);
    })
    .catch((err) => {
      console.error('Failed to load certification options', err);
    });

}, [token]);

  const add = async (e) => {
    e.preventDefault();
    setError("");
    const errs = {};
    const certName = form.name === "__other__" ? (form.customName || "").trim() : (form.name || "").trim();
    if (!certName) errs.name = "Certification name is required";
    if (!form.issuer.trim()) errs.issuer = "Issued by is required";
    if (!selectedFile) errs.file = "Please upload a certificate";
    else if (selectedFile.size > 5 * 1024 * 1024) errs.file = "File size must not exceed 5 MB";
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    await callAdd(async () => {
      const data = await api.addCert(token, { ...form, name: certName, year: form.year ? Number(form.year) : undefined,issuedOn: form.issuedOn || undefined, expiryDate: form.expiryDate || undefined }, selectedFile);
      if (data.error) { setError(data.error); return; }
      setCerts(data.certifications);
      setForm({ name: "", customName: "", issuer: "", issuedOn: "", expiryDate: "" });
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
            <button className="close-btn" onClick={() => { setShowModal(false); setFormErrors({}); setError(""); }}>
              ✕
            </button>
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontWeight: "500", fontSize: "15px"}}>Add Certification </label>
               
            </div>
            
            <div className="card form-card">
              <form onSubmit={add} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group">
                  <label>Certification Name <span style={{ color: "red" }}>*</span></label>
                  <Dropdown
                    options={[...(certOptions || []), "Other"]}
                    value={form.name === "__other__" ? "Other" : (form.name || "")}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "Other") {
                        setForm({ ...form, name: "__other__", customName: "" });
                      } else {
                        setForm({ ...form, name: val, customName: "" });
                      }
                      setFormErrors((p) => ({ ...p, name: "" }));
                    }}
                    placeholder="--Select certification--"
                  />
                  {form.name === "__other__" && (
                    <input
                      style={{ marginTop: 8 }}
                      placeholder="Enter certification name"
                      value={form.customName || ""}
                      onChange={(e) => { setForm({ ...form, name: "__other__", customName: e.target.value }); setFormErrors((p) => ({ ...p, name: "" })); }}
                    />
                  )}
                  {formErrors.name && <span style={{ color: "red", fontSize: 12 }}>{formErrors.name}</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div className="form-group">
                    <label>Issued by <span style={{ color: "red" }}>*</span></label>
                    <input
                      placeholder="(e.g. AWS, Google)"
                      value={form.issuer}
                      onChange={(e) => { setForm({ ...form, issuer: e.target.value }); setFormErrors((p) => ({ ...p, issuer: "" })); }}
                    />
                    {formErrors.issuer && <span style={{ color: "red", fontSize: 12 }}>{formErrors.issuer}</span>}
                  </div>
                  <div className="form-group">
                    <label>Issued On</label>
                    <input
                      type="date"
                      value={form.issuedOn}
                      onChange={(e) => setForm({ ...form, issuedOn: e.target.value })}
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
                  <div className="form-group" style={{ marginBottom: 4 }}>
                    <label>Upload Certificate <span style={{ color: "red" }}>*</span></label>
                  </div>
                  <label
                    htmlFor="cert-file"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f && f.size > 5 * 1024 * 1024) {
                        setFormErrors((p) => ({ ...p, file: "File size must not exceed 5 MB" }));
                      } else if (f) {
                        setSelectedFile(f);
                        setFormErrors((p) => ({ ...p, file: "" }));
                      }
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
                      Click to upload or drag and drop your certificate (PDF, JPG, PNG)
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Max file size: 5 MB</span>
                    <input
                      id="cert-file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files[0] || null;
                        if (f && f.size > 5 * 1024 * 1024) {
                          setFormErrors((p) => ({ ...p, file: "File size must not exceed 5 MB" }));
                          setSelectedFile(null);
                          e.target.value = "";
                        } else {
                          setSelectedFile(f);
                          setFormErrors((p) => ({ ...p, file: "" }));
                        }
                      }}
                    />
                  </label>
                  {formErrors.file && <span style={{ color: "red", fontSize: 12 }}>{formErrors.file}</span>}
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
                  {/* <div style={{ fontSize: "34px" }}>🗑️</div> */}
                  <div>View Certificate ↗</div>
                </button>
              )}
              <Button variant="edit" onClick={() => openEdit(c)}><i className="fas fa-edit"></i></Button>
              <Button variant="delete" onClick={() => setDeleteTargetId(c.id)}><i className="fas fa-trash"></i></Button>           </div>
          ))}
        </div>
      )}

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      <DialogBox
        isOpen={!!editingCert}
        onClose={closeEdit}
        title="Edit Certification"
        width={480}
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={closeEdit}>Cancel</button>
            <Button variant="primary" type="submit" form="edit-cert-form" loading={updatingCert}>
              {updatingCert ? "Saving..." : "Save Changes"}
            </Button>
          </>
        }
      >
        <form id="edit-cert-form" onSubmit={saveEdit} className="card form-card">
          <InputField label="Certification Name" placeholder="Certification name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <InputField label="Issued by" placeholder="Issued by (e.g. AWS, Google)" value={editForm.issuer} onChange={(e) => setEditForm({ ...editForm, issuer: e.target.value })} />
          <DatePicker label="Issued On" value={editForm.issuedOn} onChange={(e) => setEditForm({ ...editForm, issuedOn: e.target.value })} />
          <DatePicker label="Expiry Date" value={editForm.expiryDate} onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })} />
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
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          >
            <span style={{ fontSize: 22 }}>📎</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
              {editingCert?.fileName
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
            <p style={{ fontSize: 13, color: "var(--primary)", display: "flex", alignItems: "center", gap: 4 }}>
              📄 {editFile.name}
            </p>
          )}
          {editError && <p className="error">{editError}</p>}
        </form>
      </DialogBox>

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

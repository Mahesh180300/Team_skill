import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import Button from "../components/common/Button";
import CertLogo from "../components/common/CertLogo";
import ConfirmDialog from "../components/common/ConfirmDialog";
import DialogBox from "../components/common/DialogBox";
import Loader from "../components/Loader";
import LoaderDialog from "../components/LoaderDialog";
import { useApi } from "../hooks/useApi";
import InputField from "../components/common/InputField";
import DatePicker from "../components/common/DatePicker";
import Dropdown from "../components/common/Dropdown";
import Breadcrumb from "../components/common/Breadcrumb";
import Pagination from "../components/common/Pagination";
import EditButton from "../components/common/EditButton";
import DeleteButton from "../components/common/DeleteButton";

const STAT_CARDS = [
  {
    key: "totalCertifications",
    label: "Total Certifications",
    icon: "fas fa-award",
    iconBg: "#eef2ff",
    accent: "#4a4b6b",
  },
  {
    key: "activeCertifications",
    label: "Active Certifications",
    icon: "fas fa-check-circle",
    iconBg: "#eef2ff",
    accent: "#4a4b6b",
  },
  {
    key: "expiringSoon",
    label: "Expiring Soon",
    icon: "fas fa-clock",
    iconBg: "#eef2ff",
    accent: "#4a4b6b",
  },
  {
    key: "expiredCertifications",
    label: "Expired",
    icon: "fas fa-times-circle",
    iconBg: "#eef2ff",
    accent: "#4a4b6b",
  },
];

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
  const [certStats, setCertStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 4;

  const callAdd = useApi(setAddingCert);
  const callUpdate = useApi(setUpdatingCert);
  const callDelete = useApi(setDeletingCert);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const refreshStats = () => {
    api.getCertStats(token).then(setCertStats).catch(() => {});
  };

  // ── Edit state ──────────────────────────────────────────────────────────────
  const [editingCert, setEditingCert] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", customName: "", issuer: "", issuedOn: "", expiryDate: "" });
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

    refreshStats();
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
      const data = await api.addCert(token, { ...form, name: certName, year: form.year ? Number(form.year) : undefined, issuedOn: form.issuedOn || undefined, expiryDate: form.expiryDate || undefined }, selectedFile);
      if (data.error) { setError(data.error); return; }
      setCerts(data.certifications);
      setSharedProfile((p) => ({ ...p, certifications: data.certifications }));
      setForm({ name: "", customName: "", issuer: "", issuedOn: "", expiryDate: "" });
      setSelectedFile(null);
      setShowModal(false);
      showToast("Certification added successfully.");
      refreshStats();
      const newTotal = data.certifications.length;
      setCurrentPage(Math.ceil(newTotal / cardsPerPage));
    });
  };

  const remove = async (certId) => {
    await callDelete(async () => {
      const data = await api.deleteCert(token, certId);
      setCerts((prev) => {
        const updated = data.certifications;
        const newTotal = updated.length;
        const newTotalPages = Math.ceil(newTotal / cardsPerPage);
        setCurrentPage((p) => Math.min(p, newTotalPages || 1));
        return updated;
      });
      setSharedProfile((p) => ({ ...p, certifications: data.certifications }));
      setDeleteTargetId(null);
      showToast("Certification deleted successfully.");
      refreshStats();
    });
  };

  const openEdit = (cert) => {
    setEditingCert(cert);
    const isKnown = certOptions.includes(cert.name);
    setEditForm({
      name: isKnown ? cert.name : "__other__",
      customName: isKnown ? "" : cert.name,
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
      const resolvedName = editForm.name === "__other__" ? (editForm.customName || "").trim() : editForm.name;
      const data = await api.editCert(token, editingCert.id, { ...editForm, name: resolvedName, issuedOn: editForm.issuedOn || undefined, expiryDate: editForm.expiryDate || undefined }, editFile);
      if (data.error) { setEditError(data.error); return; }
      setCerts(data.certifications);
      setSharedProfile((p) => ({ ...p, certifications: data.certifications }));
      closeEdit();
      showToast("Certification updated successfully");
      refreshStats();
    });
  };

  const getCertStatus = (expiryDate) => {
    if (!expiryDate) return { label: "Active", cls: "cert-status-valid" };
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: "Expired", cls: "cert-status-expired" };
    if (diffDays <= 90) return { label: "Expiring Soon", cls: "cert-status-expiring" };
    return { label: "Active", cls: "cert-status-valid" };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
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
      <Breadcrumb action={
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Add Certification
        </Button>
      } />
      {toast && <div className="toast success">{toast}</div>}

      {/* ── Summary Stats ────────────────────────────────────────────────────── */}
      <div className="cert-stats-grid">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className="cert-stat-card">
            <div className="cert-stat-icon" style={{ background: card.iconBg }}>
              <i className={card.icon} style={{ color: card.accent, fontSize: 20 }}></i>
            </div>
            <div className="cert-stat-body">
              <div className="cert-stat-count" style={{ color: card.accent }}>
                {certStats ? certStats[card.key] : "—"}
              </div>
              <div className="cert-stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

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
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <span style={{ fontSize: 28 }}>📎</span>
                    <span style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
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
                    <p style={{ marginTop: 8, fontSize: 13, color: "var(--primary)", display: "flex", alignItems: "center", gap: 4 }}>
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
        <>
        <div className="certs-list">
          {(() => {
            const totalPages = Math.ceil(certs.length / cardsPerPage);
            const paginated = certs.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage);
            return paginated.map((c) => {
            const status = getCertStatus(c.expiryDate);
            return (
              <div key={c.id} className="modern-cert-card">
                <div className="modern-cert-icon"><CertLogo name={c.name} size={42} /></div>
                <div className="modern-cert-content">
                  <span className={`cert-status-badge ${status.cls}`}>{status.label}</span>
                  <div className="cert-card-top">
                    <h3 className="cert-card-name">{c.name}</h3>
                  </div>
                  {c.issuer && (
                    <div className="cert-meta-row">
                      <span>Issued by: <strong style={{color:"#383da7"}}>{c.issuer}</strong></span>
                    </div>
                  )}
                  <div className="cert-meta-dates">
                    {c.issuedOn && (
                      <div className="cert-meta-row">
                        <i className="fas fa-calendar-alt cert-meta-icon"></i>
                        <span>Issued: {formatDate(c.issuedOn)}</span>
                      </div>
                    )}
                    {c.expiryDate && (
                      <div className="cert-meta-row">
                        <i className="fas fa-calendar-times cert-meta-icon"></i>
                        <span>Expires: {formatDate(c.expiryDate)}</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* <div className="cert-card-actions"> */}
                  {(c.fileUrl || c.fileData) && (
                    <button
                      className="certificate-box"
                      onClick={() => {
                        if (c.fileUrl) {
                          window.open(c.fileUrl, "_blank");
                        } else {
                          const bytes = Uint8Array.from(atob(c.fileData), (ch) => ch.charCodeAt(0));
                          const url = URL.createObjectURL(new Blob([bytes], { type: c.fileType }));
                          window.open(url, "_blank");
                        }
                      }}
                    >
                      <div> View Certificate ↗</div>
                    </button>
                  )}
                 
                    <EditButton variant="edit" onClick={() => openEdit(c)} title="Edit">
                      <i className="fas fa-edit"></i>
                    </EditButton>
                    <DeleteButton variant="delete" onClick={() => setDeleteTargetId(c.id)} title="Delete">
                      <i className="fas fa-trash"></i>
                    </DeleteButton>
                 
                {/* </div> */}
              </div>
            );
            });
          })()}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(certs.length / cardsPerPage)}
          onPageChange={setCurrentPage}
        />
        </>
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
          <div className="form-group">
            <label>Certification Name</label>
            <Dropdown
              options={[...(certOptions || []), "Other"]}
              value={editForm.name === "__other__" ? "Other" : (editForm.name || "")}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "Other") {
                  setEditForm({ ...editForm, name: "__other__", customName: "" });
                } else {
                  setEditForm({ ...editForm, name: val, customName: "" });
                }
              }}
              placeholder="--Select certification--"
            />
            {editForm.name === "__other__" && (
              <input
                style={{ marginTop: 8 }}
                placeholder="Enter certification name"
                value={editForm.customName || ""}
                onChange={(e) => setEditForm({ ...editForm, customName: e.target.value })}
              />
            )}
          </div>
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
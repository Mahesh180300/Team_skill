import { useAuth } from "../context/AuthContext";
import api from "../api";
import { useState } from "react";
import LoaderDialog from "../components/LoaderDialog";
import { useApi } from "../hooks/useApi";
import DeleteButton from "../components/common/DeleteButton";
import EditButton from "../components/common/EditButton";
import useDeleteConfirm from "../hooks/useDeleteConfirm";
import Breadcrumb from "../components/common/Breadcrumb";

export default function DocumentsPage() {
  const { token, profile, setProfile } = useAuth();
  const [resumeUploading, setResumeUploading] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);
  const [msg, setMsg] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const callResume = useApi(setResumeUploading);
  const callDelete = useApi(setDeletingResume);

  const showToast = (text) => { setMsg(text); setTimeout(() => setMsg(""), 2500); };

  const uploadResume = async (file) => {
    if (file.size > 2 * 1024 * 1024) {
      showToast("Resume must be 2MB or less");
      return;
    }
    try {
      await callResume(async () => {
        const data = await api.uploadResume(token, file);
        if (data.resumeData) {
          const updated = {
            ...profile,
            resumeData: data.resumeData,
            resumeFileName: data.resumeFileName,
            resumeFileType: data.resumeFileType,
            updatedAt: data.updatedAt || new Date().toISOString(),
          };
          setProfile(updated);
          showToast("Resume uploaded successfully");
        } else if (data.error) {
          showToast(data.error);
        }
      });
    } catch (err) {
      showToast(err.message || "Resume upload failed");
    }
  };

  const deleteResume = async () => {
    await callDelete(async () => {
      await api.deleteResume(token);
      setProfile({ ...profile, resumeData: "", resumeFileName: "", resumeFileType: "" });
      showToast("Resume deleted successfully.");
    });
  };

  const { triggerDelete: confirmDelete, DeleteDialog } = useDeleteConfirm({
    onConfirm: deleteResume,
    title: "Delete Resume",
    message: "Are you sure you want to delete your resume? This cannot be undone.",
    confirmText: "Yes, Delete",
  });

  const openResume = () => {
    const bytes = Uint8Array.from(atob(profile.resumeData), (ch) => ch.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: profile.resumeFileType }));
    window.open(url, "_blank");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadResume(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragActive(false); };

  
  const fileSizeKB = profile?.resumeData
    ? ((profile.resumeData.length * 0.75) / 1024).toFixed(1)
    : null;

  const lastUpdatedLabel = profile?.updatedAt
    ? new Date(profile.updatedAt).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="page">
      {resumeUploading && <LoaderDialog message="Uploading resume..." />}
      {deletingResume && <LoaderDialog message="Deleting resume..." />}
      {msg && <div className="toast success">{msg}</div>}

      <div className="page-header">
        <h2>Documents</h2>
      </div>
      <Breadcrumb />

      <div className="doc-upload-card">
        <div className="doc-upload-header">
          <h3>Resume</h3>
          <p>Upload your professional resume for recruiters and hiring managers</p>
        </div>

        <input
          id="doc-resume-input"
          type="file"
          accept=".pdf,.doc,.docx"
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files[0]) uploadResume(e.target.files[0]); e.target.value = ""; }}
        />

        {profile?.resumeData ? (
          // ---- Uploaded state: matches Image 2 ----
          <div className="doc-uploaded-card" key="uploaded">
            <div className="doc-uploaded-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <div className="doc-uploaded-info">
              <span className="doc-uploaded-name">{profile.resumeFileName}</span>
              <div className="doc-uploaded-meta">
                <span className="doc-uploaded-size">
                  {fileSizeKB} KB &middot; {profile.resumeFileType}
                </span>
                {lastUpdatedLabel && (
                  <span className="doc-uploaded-size">Last updated: {lastUpdatedLabel}</span>
                )}
              </div>
            </div>
            <div className="doc-uploaded-right">
              <span className="doc-uploaded-badge">
                <i className="fas fa-check-circle"></i> Uploaded
              </span>
              <div className="doc-uploaded-actions">
                <button className="resume-btn resume-btn-icon" onClick={openResume} title="View">
                  <i className="fas fa-eye"></i>
                </button>
                <EditButton
                style={{ color: "#43a1d8" }}
                  onClick={() => document.getElementById("doc-resume-input").click()}
                  disabled={resumeUploading}
                  title="Replace"
                />
                <DeleteButton onClick={confirmDelete} disabled={deletingResume} />
              </div>
            </div>
          </div>
        ) : (
          // ---- Empty state: matches Image 1 ----
      //     <label
      //       htmlFor="doc-resume-input"
      //       className={`doc-empty-state ${dragActive ? "doc-drop-zone-active" : ""}`}
      //       key="empty"
      //       onDrop={handleDrop}
      //       onDragOver={handleDragOver}
      //       onDragLeave={handleDragLeave}
      //     >
      //       <div className="doc-empty-left">
      //         <div className="doc-drop-icon">
      //           <i className="fas fa-paperclip"></i>
      //         </div>
      //         <div>
      //           <p className="doc-drop-title">No resume uploaded yet</p>
      //           <p className="doc-drop-sub">PDF, DOC or DOCX &middot; Max 2MB</p>
      //         </div>
      //       </div>
      //       <span className="resume-btn resume-btn-upload-main">
      //         {resumeUploading ? "Uploading..." : "Upload Resume"}
      //       </span>
      //     </label>
      //   )}
      // </div>
       <div className="doc-empty-state">
        <div className="document-upload">
        <div className="doc-empty-left">
            <div className="doc-empty-icon">📎</div>
            <div>
              <p className="doc-empty-title">No resume uploaded yet</p>
              <p className="doc-empty-sub">PDF, DOC or DOCX · Max 2MB</p>
            </div>
            </div>
            <div>
            <button className="resume-btn resume-btn-upload-main" onClick={() => document.getElementById("doc-resume-input").click()} disabled={resumeUploading}>
              {resumeUploading ? "Uploading..." : "Upload Resume"}
            </button>
            </div>
            </div>
          </div>
        )}
      </div>

      {DeleteDialog}
    </div>
  );
}

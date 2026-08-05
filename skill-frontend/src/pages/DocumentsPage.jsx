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
          const updated = { ...profile, resumeData: data.resumeData, resumeFileName: data.resumeFileName, resumeFileType: data.resumeFileType };
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

  const downloadResume = () => {
    const bytes = Uint8Array.from(atob(profile.resumeData), (ch) => ch.charCodeAt(0));
    const blob = new Blob([bytes], { type: profile.resumeFileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = profile.resumeFileName || "resume.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadResume(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragActive(false); };

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

        {profile?.resumeData ? (
          <div className="doc-uploaded-card">
            <div className="doc-uploaded-icon">📄</div>
            <div className="doc-uploaded-info">
              <span className="doc-uploaded-name">{profile.resumeFileName}</span>
              <span className="doc-uploaded-size">{(profile.resumeData.length * 0.75 / 1024).toFixed(1)} KB · {profile.resumeFileType}</span>
              {profile.updatedAt && (
                <span className="doc-uploaded-size">Last updated: {new Date(profile.updatedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              )}
            </div>
            <span className="doc-uploaded-badge">✓ Uploaded</span>
            <div className="doc-uploaded-actions">
              <button className="resume-btn resume-btn-icon" onClick={openResume} title="View">
                <i className="fas fa-eye"></i>
              </button>
              {/* <button className="resume-btn resume-btn-icon" onClick={downloadResume} title="Download">
                <i className="fas fa-download"></i>
              </button> */}
              <EditButton onClick={() => document.getElementById("doc-resume-input").click()} disabled={resumeUploading} />
              <DeleteButton onClick={confirmDelete} disabled={deletingResume} />
            </div>
          </div>
        ) : (
          <div
            className={`doc-drop-zone ${dragActive ? "doc-drop-zone-active" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="doc-drop-icon">📁</div>
            <p className="doc-drop-title">Drag & drop your resume here</p>
            <p className="doc-drop-sub">or</p>
            <label htmlFor="doc-resume-input" className="resume-btn resume-btn-upload-main">
              {resumeUploading ? "Uploading..." : "Browse Files"}
            </label>
            <p className="doc-drop-formats">PDF, DOC or DOCX · Max 2MB</p>
          </div>
        )}

        <input
          id="doc-resume-input"
          type="file"
          accept=".pdf,.doc,.docx"
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files[0]) uploadResume(e.target.files[0]); e.target.value = ""; }}
        />
      </div>

      {DeleteDialog}
    </div>
  );
}

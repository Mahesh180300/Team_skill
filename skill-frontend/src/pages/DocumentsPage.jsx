import { useAuth } from "../context/AuthContext";
import api from "../api";
import { useState } from "react";
import LoaderDialog from "../components/LoaderDialog";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { useApi } from "../hooks/useApi";

export default function DocumentsPage() {
  const { token, profile, setProfile } = useAuth();
  const [resumeUploading, setResumeUploading] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [msg, setMsg] = useState("");

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
          showToast("Resume uploaded");
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
      setShowDeleteConfirm(false);
      showToast("Resume deleted successfully.");
    });
  };

  const openResume = () => {
    const bytes = Uint8Array.from(atob(profile.resumeData), (ch) => ch.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: profile.resumeFileType }));
    window.open(url, "_blank");
  };

  return (
    <div className="page">
      {resumeUploading && <LoaderDialog message="Uploading resume..." />}
      {deletingResume && <LoaderDialog message="Deleting resume..." />}
      {msg && <div className="toast success">{msg}</div>}

      <div className="page-header">
        <h2>Documents</h2>
      </div>

      <div className="doc-section-card">
        <div className="doc-section-header">
          <div className="doc-section-title">
            <div className="doc-section-icon">📄</div>
            <div>
              <h3>Resume</h3>
              <p>Your professional resume for recruiters &amp; managers</p>
            </div>
          </div>
          {profile?.resumeData && (
            <span className="doc-uploaded-badge">✓ Uploaded</span>
          )}
        </div>

        <input
          id="doc-resume-input"
          type="file"
          accept=".pdf,.doc,.docx"
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files[0]) uploadResume(e.target.files[0]); e.target.value = ""; }}
        />

        {profile?.resumeData ? (
          <div className="doc-file-row">
            <span className="doc-file-icon">📎</span>
            <span className="doc-file-name">{profile.resumeFileName}</span>
            <div className="doc-file-actions">
              <button className="resume-btn resume-btn-view" onClick={openResume}>View Resume↗</button>
              <button className="resume-btn resume-btn-edit" onClick={() => document.getElementById("doc-resume-input").click()} disabled={resumeUploading}>
                <i className="fas fa-edit"></i>
              </button>
              <button className="resume-btn resume-btn-delete" onClick={() => setShowDeleteConfirm(true)} disabled={deletingResume}>
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        ) : (
          <div className="doc-empty-state">
            <div className="doc-empty-icon">📎</div>
            <div>
              <p className="doc-empty-title">No resume uploaded yet</p>
              <p className="doc-empty-sub">PDF, DOC or DOCX · Max 2MB</p>
            </div>
            <button className="resume-btn resume-btn-upload-main" onClick={() => document.getElementById("doc-resume-input").click()} disabled={resumeUploading}>
              {resumeUploading ? "Uploading..." : "Upload Resume"}
            </button>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          icon="🗑️"
          title="Delete Resume"
          message="Are you sure you want to delete your resume? This cannot be undone."
          confirmText="Yes, Delete"
          cancelText="Cancel"
          onConfirm={deleteResume}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

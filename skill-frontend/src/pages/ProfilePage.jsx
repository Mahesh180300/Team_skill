import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getProfile(token).then((data) => {
      setProfile(data);
      setForm({ name: data.name, department: data.department, jobTitle: data.jobTitle, yearsOfExperience: data.yearsOfExperience });
    });
  }, [token]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const uploadImage = async (file) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("profileImage", file);
      const uploadRes = await api.uploadProfileImage(token, formData);
      if (uploadRes?.error) {
        throw new Error(uploadRes.error || "Image upload failed");
      }
      setProfile(uploadRes);
      setMsg("Profile picture uploaded!");
      setTimeout(() => setMsg(""), 2000);
    } catch (err) {
      console.error("Upload profile image error:", err);
      setMsg(err?.message || "Image upload failed");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setSaving(false);
      setImageFile(null);
      setPreviewUrl("");
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateProfile(token, { ...form, yearsOfExperience: Number(form.yearsOfExperience) });
      if (updated?.error) {
        setMsg(updated.error || "Update failed");
        setTimeout(() => setMsg(""), 3000);
        return;
      }

      setProfile(updated);
      setEditing(false);
      setMsg("Profile updated!");
      setTimeout(() => setMsg(""), 2000);
    } catch (err) {
      console.error("Save profile error:", err);
      setMsg(err?.message || "Save failed");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      uploadImage(file);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setImageFile(null);
    setPreviewUrl("");
    setForm({ name: profile.name, department: profile.department, jobTitle: profile.jobTitle, yearsOfExperience: profile.yearsOfExperience });
  };

  // const deleteImage = async () => {
  //   try {
  //     const updated = await api.deleteProfileImage(token);
  //     if (updated?.error) {
  //       setMsg(updated.error || "Could not delete image");
  //       setTimeout(() => setMsg(""), 3000);
  //       return;
  //     }
  //     setProfile(updated);
  //     setImageFile(null);
  //     setPreviewUrl("");
  //     setMsg("Profile picture removed!");
  //     setTimeout(() => setMsg(""), 2000);
  //   } catch (err) {
  //     console.error("Delete profile image error:", err);
  //     setMsg(err?.message || "Delete failed");
  //     setTimeout(() => setMsg(""), 3000);
  //   }
  // };

  if (!profile) return <div className="loading">Loading...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>My Profile</h2>
        {!editing && <button className="btn-secondary" onClick={() => setEditing(true)}>Edit Profile</button>}
      </div>
      {msg && <div className="toast success">{msg}</div>}
      {editing ? (
        <form onSubmit={save} className="card form-card">
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Engineering" />
            </div>
            <div className="form-group">
              <label>Job Title</label>
              <input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="e.g. Frontend Developer" />
            </div>
            <div className="form-group">
              <label>Years of Experience</label>
              <input type="number" min="0" value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Profile Picture</label>
            <div className="profile-avatar-section">
              {(previewUrl || profile.profileImage) ? (
                <img
                  src={previewUrl || profile.profileImage}
                  alt="Profile preview"
                  className="profile-image"
                />
              ) : (
                <div className="profile-avatar">{profile.name?.charAt(0).toUpperCase()}</div>
              )}
              <div className="image-actions">
                <label className="upload-label">
                  {imageFile || profile.profileImage ? "Change photo" : "Upload photo"}
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                </label>
                {/* {(profile.profileImage || previewUrl) && (
                  <button type="button" className="btn-secondary btn-sm" onClick={deleteImage}>
                    Remove
                  </button>
                )} */}
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
            <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="card profile-card">
          <div className="profile-avatar-section">
            {profile.profileImage ? (
              <img src={profile.profileImage} alt="Profile" className="profile-image" />
            ) : (
              <div className="profile-avatar">{profile.name?.charAt(0).toUpperCase()}</div>
            )}
            {/* <div className="image-actions">
              <button type="button" className="btn-secondary btn-sm" onClick={() => setEditing(true)}>
                Edit
              </button>
              {profile.profileImage && (
                <button type="button" className="btn-secondary btn-sm" onClick={deleteImage}>
                  Delete
                </button>
              )}
            </div> */}
          </div>
          <div className="profile-details">
            <h3>{profile.name}</h3>
            <p className="profile-email">{profile.email}</p>
            <div className="profile-meta">
              {profile.jobTitle && <span className="badge">{profile.jobTitle}</span>}
              {profile.department && <span className="badge badge-dept">{profile.department}</span>}
              {profile.yearsOfExperience > 0 && <span className="badge badge-exp">{profile.yearsOfExperience} yrs exp</span>}
            </div>
          </div>
          <div className="profile-stats">
            <div className="stat"><span className="stat-val">{profile.skills?.length || 0}</span><span className="stat-lbl">Skills</span></div>
            <div className="stat"><span className="stat-val">{profile.certifications?.length || 0}</span><span className="stat-lbl">Certs</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

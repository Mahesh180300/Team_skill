import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "./ConfirmDialog";
import api from "../api";

export default function Sidebar({ page, onNavigate }) {
  const { user, token, logout, profile, setProfile } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [viewAvatar, setViewAvatar] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);

  const calcDuration = (dateStr) => {
    if (!dateStr) return "";
    const start = new Date(dateStr);
    const now = new Date();
    let months =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());
    if (months < 0) return "";
    const yrs = Math.floor(months / 12);
    const mo = months % 12;
    if (yrs === 0) return `${mo}mo`;
    if (mo === 0) return `${yrs}yr`;
    return `${yrs}yr ${mo}mo`;
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);

      const updated = await api.uploadAvatar(token, file);

      setProfile(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setDeletingAvatar(true);

      const updated = await api.deleteAvatar(token);

      setProfile(updated);
      setViewAvatar(false);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingAvatar(false);
    }
  };
  const calcCompletion = (p) => {
    const fields = [
      { label: "Profile Picture", done: !!p.avatar },
      { label: "Skills", done: p.skills?.length > 0 },
      { label: "Certifications", done: p.certifications?.length > 0 },
      { label: "Resume", done: !!p.resumeData },
    ];
    const percent = Math.round(
      (fields.filter((f) => f.done).length / fields.length) * 100,
    );
    const missing = fields.filter((f) => !f.done).map((f) => f.label);
    return { percent, missing };
  };
  const confirmLogout = () => {
    logout();
    onNavigate("login");
  };

  const adminLinks = [
    { key: "dashboard", icon: "📊", label: "Dashboard" },
    { key: "employees", icon: "👥", label: "Employees" },
    { key: "lookup", icon: "🗂️", label: "Master Data" },
  ];

  const employeeLinks = [
    { key: "profile", icon: "👤", label: "My Profile" },
    { key: "skills", icon: "📚", label: "My Skills" },
    { key: "certs", icon: "🏆", label: "Certifications" },
    { key: "documents", icon: "📁", label: "Documents" },
  ];

  const links = user?.role === "admin" ? adminLinks : employeeLinks;
  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <aside className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
        {/* Brand bar */}
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">🎯</span>
          {!collapsed && (
            <span className="sidebar-brand-text">Kyyba Team Skill Tracker</span>
          )}
          <button
            className="sidebar-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        {/* Profile card */}
        {user && profile && (
          <div
            className={`sidebar-profile-section${collapsed ? " sidebar-profile-section--collapsed" : ""}`}
          >
            <div className="sidebar-profile-avatar-wrap">
              <div
                className="sidebar-profile-avatar-large"
                onClick={() => profile.avatar && setViewAvatar(true)}
                style={{
                  cursor: profile.avatar ? "pointer" : "default",
                }}
                title={profile.avatar ? "View Profile Picture" : ""}
              >
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="avatar"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                    }}
                  />
                ) : (
                  initials
                )}
              </div>

              {!collapsed && (
                <button
                  className="sidebar-avatar-edit-btn"
                  onClick={() =>
                    document.getElementById("sidebar-avatar-input").click()
                  }
                  title="Change Profile Picture"
                >
                  ✏️
                </button>
              )}

              <input
                id="sidebar-avatar-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
            </div>
            {viewAvatar && (
              <div
                className="modal-overlay"
                onClick={() => setViewAvatar(false)}
              >
                <div
                  className="modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={profile.avatar}
                    alt="Profile"
                    style={{
                      width: 300,
                      height: 300,
                      objectFit: "cover",
                      borderRadius: "12px",
                    }}
                  />

                  <div className="avatar-modal-actions">
                    <button
                      className="avatar-btn avatar-btn-primary"
                      onClick={() =>
                        document.getElementById("sidebar-avatar-input").click()
                      }
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? "Uploading..." : "Change"}
                    </button>

                    <button
                      className="avatar-btn avatar-btn-danger"
                      onClick={handleDeleteAvatar}
                      disabled={deletingAvatar}
                    >
                      {deletingAvatar ? "Deleting..." : " Remove"}
                    </button>

                    <button
                      className="avatar-btn avatar-btn-secondary"
                      onClick={() => setViewAvatar(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
            {!collapsed && (
              <>
                <div className="sidebar-profile-info-main">
                  <h3 className="sidebar-profile-name-large">
                    {profile.firstName || user.name}{" "}
                    {profile.firstName ? profile.lastName : ""}
                  </h3>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {profile.email}
                  </div>
                </div>

                <div className="profile-completion">
                  {(() => {
                    const { percent, missing } = calcCompletion(profile);
                    return (
                      <>
                        <div className="completion-header">
                          <span>Profile Completion</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="completion-track">
                          <div
                            className="completion-fill"
                            style={{
                              width: `${percent}%`,
                              backgroundColor:
                                percent === 100
                                  ? "#22c55e"
                                  : percent >= 50
                                    ? "#f59e0b"
                                    : "#ef4444",
                            }}
                          />
                        </div>
                        {missing.length > 0 && (
                          <div className="completion-missing">
                            <small>Missing:</small>
                            {missing.map((m) => {
                              const navMap = {
                                Skills: "skills",
                                Certifications: "certs",
                              };
                              const target = navMap[m];
                              return target ? (
                                <span
                                  key={m}
                                  className="missing-tag"
                                  onClick={() => onNavigate(target)}
                                  style={{
                                    cursor: "pointer",
                                  }}
                                >
                                  {m}
                                </span>
                              ) : (
                                <span key={m} className="missing-tag">
                                  {m}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="sidebar-divider" />

        {/* Nav links */}
        <nav className="sidebar-nav">
          {links.map(({ key, icon, label }) => (
            <button
              key={key}
              className={`sidebar-link${page === key ? " active" : ""}`}
              onClick={() => onNavigate(key)}
              title={collapsed ? label : undefined}
            >
              <span className="sidebar-link-icon">{icon}</span>
              {!collapsed && (
                <span className="sidebar-link-label">{label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        <button
          className="sidebar-logout-text"
          onClick={() => setShowLogoutConfirm(true)}
          title="Logout"
        >
          <span className="sidebar-link-logout">⎋ </span>
          {!collapsed && <span>Logout</span>}
        </button>
      </aside>

      {showLogoutConfirm && (
        <ConfirmDialog
          icon="🚪"
          title="Logout"
          message="Are you sure want to logout?"
          confirmText="Yes, Logout"
          cancelText="Cancel"
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutConfirm(false)}
          danger={false}
        />
      )}
    </>
  );
}

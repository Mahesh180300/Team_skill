import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import api from "../api";
import { ROUTES } from "../router/routes";
import ConfirmDialog from "./common/ConfirmDialog";
import logoCompact from "../assets/kyylogo4.png";
import logoExpanded from "../assets/kyybaa5.png";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout, profile, setProfile } = useAuth();
  const { collapsed, setCollapsed } = useSidebar();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [viewAvatar, setViewAvatar] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAvatar, setDeletingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

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
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError(true);
      e.target.value = "";
      return;
    }
    try {
      setUploadingAvatar(true);
      const updated = await api.uploadAvatar(token, file);
      setProfile(updated);
      window.dispatchEvent(new Event('profile-updated'));
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
      window.dispatchEvent(new Event('profile-updated'));
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
      { label: "Resume", done: !!(p.resumeUrl || p.resumeData) },
    ];
    const percent = Math.round(
      (fields.filter((f) => f.done).length / fields.length) * 100,
    );
    const missing = fields.filter((f) => !f.done).map((f) => f.label);
    return { percent, missing };
  };
  const confirmLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

 const adminLinks = [
  {
    key: ROUTES.DASHBOARD,
    icon: <i className="fa-solid fa-gauge-high"></i>,
    label: "Dashboard",
  },
  {
    key: ROUTES.EMPLOYEES,
    icon: <i className="fa-solid fa-users"></i>,
    label: "Employees",
  },
  {
    key: ROUTES.LOOKUP,
    icon: <i className="fa-solid fa-database"></i>,
    label: "Master Data",
  },
];

  const employeeLinks = [
    { key: ROUTES.PROFILE,        icon: <i className="fa-solid fa-user"></i>, label: "My Profile" },
    { key: ROUTES.SKILLS,         icon: <i className="fa-solid fa-book"></i>, label: "My Skills" },
    { key: ROUTES.CERTIFICATIONS, icon: <i className="fa-solid fa-award"></i>, label: "Certifications" },
    { key: ROUTES.DOCUMENTS,      icon: <i className="fa-solid fa-folder"></i>, label: "Documents" },
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
          <img
            src={collapsed ? logoCompact : logoExpanded}
            alt="KTF Logo"
            className="sidebar-brand-logo"
            style={{ width: collapsed ? "45px" : "270px", height: "auto", mixBlendMode: "screen", marginLeft: collapsed ? "0" : "-20px", marginTop: "10px" }}
          />
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

                {user?.role !== "admin" && (
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
                                Skills: ROUTES.SKILLS,
                                Certifications: ROUTES.CERTIFICATIONS,
                              };
                              const target = navMap[m];
                              return target ? (
                                <span
                                  key={m}
                                  className="missing-tag"
                                  onClick={() => navigate(target)}
                                  style={{ cursor: "pointer" }}
                                >
                                  {m}
                                </span>
                              ) : (
                                <span key={m} className="missing-tag">{m}</span>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
                )}
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
              className={`sidebar-link${location.pathname === key ? " active" : ""}`}
              onClick={() => navigate(key)}
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
          <span className="sidebar-link-logout"><i className="fa-solid fa-sign-out-alt"></i> </span>
          {!collapsed && <span className="Logout">Logout</span>}
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

      {avatarError && (
        <div className="confirm-overlay" onClick={() => setAvatarError(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon-wrap confirm-icon-danger">⚠️</div>
            <div className="confirm-title">File Too Large</div>
            <div className="confirm-message">
              The selected image exceeds the 2 MB limit.<br />Please choose a smaller file.
            </div>
            <div className="confirm-actions">
              <button className="confirm-btn-ok confirm-btn-primary" onClick={() => setAvatarError(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

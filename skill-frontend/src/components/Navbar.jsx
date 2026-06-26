import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "./ConfirmDialog";

export default function Navbar({ page, onNavigate }) {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const confirmLogout = () => {
    logout();
    onNavigate("login");
  };

  const adminLinks = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "employees", label: "Employees", icon: "👥" },
    { key: "lookup", label: "Master Data", icon: "🗂️" },
  ];

  const userLinks = [
    { key: "profile", label: "My Profile", icon: "👤" },
    { key: "skills", label: "My Skills", icon: "💡" },
    { key: "certs", label: "Certifications", icon: "🏅" },
  ];

  const links = user?.role === "admin" ? adminLinks : userLinks;

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand" onClick={() => onNavigate(user?.role === "admin" ? "dashboard" : "profile")}>
          <span className="brand-icon">🎯</span>
          <span>Skill Tracker</span>
        </div>

        {user && (
          <>
            <nav className="sidebar-links">
              {links.map(({ key, label, icon }) => (
                <button
                  key={key}
                  className={`sidebar-link${page === key ? " active" : ""}`}
                  onClick={() => onNavigate(key)}
                >
                  <span className="sidebar-link-icon">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="sidebar-footer">
              <div className="sidebar-user">
                <div className="sidebar-avatar">{user.name?.charAt(0).toUpperCase()}</div>
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name">{user.name}</span>
                  <span className="sidebar-user-role">{user.role}</span>
                </div>
              </div>
              <button className="btn-logout" onClick={() => setShowLogoutConfirm(true)}>Logout</button>
            </div>
          </>
        )}
      </aside>

      {showLogoutConfirm && (
        <ConfirmDialog
          icon="🚪"
          title="Logout"
          message="Are you sure you want to logout?"
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

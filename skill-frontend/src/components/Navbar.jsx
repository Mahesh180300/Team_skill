import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "./ConfirmDialog";

export default function Navbar({ page, onNavigate }) {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => setShowLogoutConfirm(true);

  const confirmLogout = () => {
    logout();
    onNavigate("login");
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => onNavigate(user?.role === "admin" ? "dashboard" : "profile")}>
          <span className="brand-icon">🎯</span>
          <span>Kyyba Skill Tracker</span>
        </div>
        {user && (
          <div className="navbar-links">
            {user.role === "admin" ? (
              <>
                <button className={page === "dashboard" ? "active" : ""} onClick={() => onNavigate("dashboard")}>Dashboard</button>
                <button className={page === "employees" ? "active" : ""} onClick={() => onNavigate("employees")}>Employees</button>
              </>
            ) : (
              <>
                <button className={page === "profile" ? "active" : ""} onClick={() => onNavigate("profile")}>My Profile</button>
                <button className={page === "skills" ? "active" : ""} onClick={() => onNavigate("skills")}>My Skills</button>
                <button className={page === "certs" ? "active" : ""} onClick={() => onNavigate("certs")}>Certifications</button>
              </>
            )}
            <div className="user-menu">
              <span className="user-name">{user.name}</span>
              <button className="btn-logout" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        )}
      </nav>

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

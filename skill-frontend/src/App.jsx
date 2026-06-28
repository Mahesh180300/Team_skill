import { useEffect } from "react";
import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Navbar";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import SkillsPage from "./pages/SkillsPage";
import CertificationsPage from "./pages/CertificationsPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import LookupPage from "./pages/LookupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import api from "./api";

function AppInner() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("login");

  useEffect(() => {
    if (!loading && user) {
      setPage(user.role === "admin" ? "dashboard" : "profile");
    }
  }, [user, loading]);

  // Seed admin on first load (dev convenience)
  useEffect(() => {
    api.seedAdmin();
  }, []);

  if (loading) return <div className="loading full-screen">Loading...</div>;

  if (!user) {
    if (page === "forgot-password") return <ForgotPasswordPage onNavigate={setPage} />;
    return <AuthPage mode={page === "register" ? "register" : "login"} onNavigate={setPage} />;
  }

  return (
    <div className="app-layout">
      <Sidebar page={page} onNavigate={setPage} />
      <main className="main-content">
        {page === "profile" && <ProfilePage onNavigate={setPage} />}
        {page === "skills" && <SkillsPage />}
        {page === "certs" && <CertificationsPage />}
        {page === "dashboard" && <DashboardPage />}
        {page === "employees" && <EmployeesPage />}
        {page === "lookup" && <LookupPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

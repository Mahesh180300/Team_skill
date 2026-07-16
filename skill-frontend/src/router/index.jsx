import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "./routes";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";
import Sidebar from "../components/Navbar";
import StickyChatWidget from "../components/StickyChatWidget";
import AuthPage from "../pages/AuthPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import ProfilePage from "../pages/ProfilePage";
import SkillsPage from "../pages/SkillsPage";
import CertificationsPage from "../pages/CertificationsPage";
import DocumentsPage from "../pages/DocumentsPage";
import DashboardPage from "../pages/DashboardPage";
import EmployeesPage from "../pages/EmployeesPage";
import LookupPage from "../pages/LookupPage";

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <StickyChatWidget />
    </div>
  );
}

export const router = createBrowserRouter([
  { path: ROUTES.LOGIN,           element: <PublicRoute><AuthPage mode="login" /></PublicRoute> },
  { path: ROUTES.REGISTER,        element: <PublicRoute><AuthPage mode="register" /></PublicRoute> },
  { path: ROUTES.FORGOT_PASSWORD, element: <PublicRoute><ForgotPasswordPage /></PublicRoute> },
  { path: ROUTES.RESET_PASSWORD,  element: <PublicRoute><ResetPasswordPage /></PublicRoute> },
  {
    element: <PrivateRoute><AppLayout /></PrivateRoute>,
    children: [
      { path: ROUTES.PROFILE,        element: <ProfilePage /> },
      { path: ROUTES.SKILLS,         element: <SkillsPage /> },
      { path: ROUTES.CERTIFICATIONS, element: <CertificationsPage /> },
      { path: ROUTES.DOCUMENTS,      element: <DocumentsPage /> },
      { path: ROUTES.DASHBOARD,      element: <PrivateRoute adminOnly><DashboardPage /></PrivateRoute> },
      { path: ROUTES.EMPLOYEES,      element: <PrivateRoute adminOnly><EmployeesPage /></PrivateRoute> },
      { path: ROUTES.LOOKUP,         element: <PrivateRoute adminOnly><LookupPage /></PrivateRoute> },
    ],
  },
  { path: "/", element: <Navigate to={ROUTES.LOGIN} replace /> },
]);

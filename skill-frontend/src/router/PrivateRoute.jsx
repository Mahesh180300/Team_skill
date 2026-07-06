import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import { ROUTES } from "./routes";

export default function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader message="Loading..." />;
  if (!user) return <Navigate to={ROUTES.LOGIN} replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to={ROUTES.PROFILE} replace />;

  return children;
}

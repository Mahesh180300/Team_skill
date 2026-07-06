import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";
import { ROUTES } from "./routes";

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader message="Loading..." />;
  if (user) return <Navigate to={user.role === "admin" ? ROUTES.DASHBOARD : ROUTES.PROFILE} replace />;

  return children;
}

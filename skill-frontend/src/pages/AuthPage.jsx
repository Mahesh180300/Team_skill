import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

export default function AuthPage({ mode, onNavigate }) {
  const { login, register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "", jobTitle: "", yearsOfExperience: "", role: "employee" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const user = await login(form.email, form.password);
        onNavigate(user.role === "admin" ? "dashboard" : "profile");
      } else {
        const user = await register({ ...form, yearsOfExperience: Number(form.yearsOfExperience) || 0 });
        onNavigate(user.role === "admin" ? "dashboard" : "profile");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🎯</span>
          <h1>Kyyba Team Skill Tracker</h1>
          <p>{mode === "login" ? "Sign in to your account" : "Create your profile"}</p>
        </div>
        <form onSubmit={submit} className="auth-form">
          {mode === "register" && (
            <>
              <input name="name" placeholder="Full Name" value={form.name} onChange={set} required />
              <input name="department" placeholder="Department (e.g. Engineering)" value={form.department} onChange={set} />
              <input name="jobTitle" placeholder="Job Title (e.g. Frontend Developer)" value={form.jobTitle} onChange={set} />
              <input name="yearsOfExperience" type="number" min="0" placeholder="Years of Experience" value={form.yearsOfExperience} onChange={set} />
              <input name="role" value="Employee" readOnly style={{ color: "gray", background: "var(--bg)", cursor: "not-allowed" }} />
            </>
          )}
          <input name="email" type="email" placeholder="Email" value={form.email} onChange={set} required />
          <div className="password-wrapper">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={set}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Register"}
          </button>
          {mode === "login" && (
            <div style={{ textAlign: "right", marginTop: "4px" }}>
              <button type="button" style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: "0.85rem" }} onClick={() => onNavigate("forgot-password")}>
                Forgot password?
              </button>
            </div>
          )}
        </form>
        <div className="auth-switch">
          {mode === "login" ? (
            <>Don't have an account? <button onClick={() => onNavigate("register")}>Register</button></>
          ) : (
            <>Already have an account? <button onClick={() => onNavigate("login")}>Sign In</button></>
          )}
        </div>
        <div className="auth-hint">
          <small>Admin: admin@kyyba.com / admin123</small>
        </div>
      </div>
    </div>
  );
}

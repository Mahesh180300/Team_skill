import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import LoaderDialog from "../components/LoaderDialog";
import api from "../api";

export default function AuthPage({ mode, onNavigate }) {
  const { login, register } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", department: "", jobTitle: "", role: "employee" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const callApi = useApi(setLoading);
  const [departments, setDepartments] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);

  useEffect(() => {
    if (mode === "register") {
      api.getLookupValues("Department").then((v) => setDepartments(Array.isArray(v) ? v : []));
      api.getLookupValues("Job Title").then((v) => setJobTitles(Array.isArray(v) ? v : []));
    }
  }, [mode]);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    await callApi(async () => {
      try {
        if (mode === "login") {
          const user = await login(form.email, form.password);
          onNavigate(user.role === "admin" ? "dashboard" : "profile");
        } else {
          const user = await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, department: form.department, jobTitle: form.jobTitle });
          onNavigate(user.role === "admin" ? "dashboard" : "profile");
        }
      } catch (err) {
        setError(err.message);
      }
    });
  };

  return (
    <div className="auth-page">
      {loading && <LoaderDialog message={mode === "login" ? "Signing in..." : "Creating account..."} />}
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🎯</span>
          <h1>Kyyba Team Skill Tracker</h1>
          <p>{mode === "login" ? "Sign in to your account" : "Create your profile"}</p>
        </div>
        <form onSubmit={submit} className="auth-form">
          {mode === "register" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input name="firstName" placeholder="First Name" value={form.firstName} onChange={set} required />
                <input name="lastName" placeholder="Last Name" value={form.lastName} onChange={set} required />
              </div>
              <select name="department" value={form.department} onChange={set}>
                <option value="">Select Department</option>
                {departments.map((d) => <option key={d.id} value={d.value}>{d.value}</option>)}
              </select>
              <select name="jobTitle" value={form.jobTitle} onChange={set}>
                <option value="">Select Job Title</option>
                {jobTitles.map((j) => <option key={j.id} value={j.value}>{j.value}</option>)}
              </select>
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
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? (mode === "login" ? "Signing in..." : "Creating...") : mode === "login" ? "Sign In" : "Register"}
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
        {/* <div className="auth-hint">
          <small>Admin: sajiths@kyyba.com / admin123</small>
        </div> */}
      </div>
    </div>
  );
}

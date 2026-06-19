import { useState, useEffect } from "react";
import api from "../api";

export default function ResetPasswordPage({ onNavigate }) {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match");
    setLoading(true);
    setError("");
    try {
      const res = await api.resetPassword(token, password);
      if (res.message) {
        setMsg(res.message);
      } else {
        setError(res.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="error" style={{ textAlign: "center" }}>Invalid or missing reset token.</p>
        <div className="auth-switch"><button onClick={() => onNavigate("login")}>Back to Sign In</button></div>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🔒</span>
          <h1>Reset Password</h1>
          <p>Enter your new password</p>
        </div>
        {msg ? (
          <>
            <p style={{ color: "green", textAlign: "center" }}>{msg}</p>
            <div className="auth-switch"><button onClick={() => onNavigate("login")}>Go to Sign In</button></div>
          </>
        ) : (
          <form onSubmit={submit} className="auth-form">
            <input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <input type="password" placeholder="Confirm Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

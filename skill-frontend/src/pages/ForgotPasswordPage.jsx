import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import LoaderDialog from "../components/LoaderDialog";
import { useApi } from "../hooks/useApi";
import { ROUTES } from "../router/routes";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // "email" | "otp" | "reset"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const otpInputs = useRef([]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const callApi = useApi(setLoading);

  const otpDigits = otp.split("").concat(Array(4).fill("")).slice(0, 4);

  const handleOtpChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 1);
    const nextDigits = otpDigits.slice();
    nextDigits[index] = value;
    const nextOtp = nextDigits.join("").slice(0, 4);
    setOtp(nextOtp);
    if (value && index < 3) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;
    setOtp(pasted);
    const focusIndex = Math.min(pasted.length, 3);
    setTimeout(() => otpInputs.current[focusIndex]?.focus());
  };

  const startOtpTimer = () => setOtpTimer(60);

  useEffect(() => {
    if (step !== "otp" || otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, otpTimer]);

  const sendOtpRequest = async () => {
    setError("");
    await callApi(async () => {
      const res = await api.forgotPassword(email);
      if (res.message) {
        setStep("otp");
        setOtp("");
        startOtpTimer();
      } else {
        setError(res.error || "Something went wrong");
      }
    });
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    await sendOtpRequest();
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    await callApi(async () => {
      const res = await api.verifyOtp(email, otp);
      if (res.message === "OTP verified") setStep("reset");
      else setError(res.message || res.error || "Invalid OTP");
    });
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError("Passwords do not match");
    setError("");
    await callApi(async () => {
      const res = await api.resetPassword(email, otp, password);
      if (res.message && !res.statusCode) setSuccessMsg(res.message);
      else setError(res.message || "Something went wrong");
    });
  };

  if (successMsg) return (
    <>
      <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">✅</span>
          <h1>Password Reset</h1>
          <p style={{ color: "green" }}>{successMsg}</p>
        </div>
        <div className="auth-switch">
          <button onClick={() => navigate(ROUTES.LOGIN)}>Go to Sign In</button>
        </div>
      </div>
    </div>
    </>
  );

  return (
    <>
      {loading && <LoaderDialog message={step === "email" ? "Sending OTP..." : step === "otp" ? "Verifying OTP..." : "Resetting password..."} />
      }
      <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">{step === "email" ? "🔑" : step === "otp" ? "📩" : "🔒"}</span>
          <h1>Forgot Password</h1>
          <p>
            {step === "email" && "Enter your email to receive an OTP"}
            {step === "otp" && `Enter the 4-digit OTP sent to ${email}`}
            {step === "reset" && "Set your new password"}
          </p>
        </div>

        {step === "email" && (
          <form onSubmit={sendOtp} className="auth-form">
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyOtp} className="auth-form">
            <div className="otp-inputs" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  className="otp-input"
                  value={digit}
                  onChange={(e) => handleOtpChange(e, index)}
                  onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  required
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>
            <small style={{ color: "gray", textAlign: "center", display: "block" }}>
              {otpTimer > 0 ? `OTP expires in ${String(Math.floor(otpTimer / 60)).padStart(2, "0")}:${String(otpTimer % 60).padStart(2, "0")}` : "OTP expired. Please resend."}
            </small>
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading || otp.length !== 4 || otpTimer === 0}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: "0.85rem", marginTop: "4px" }}
              onClick={async () => {
                setError("");
                await sendOtpRequest();
              }}
              disabled={loading}
            >
              Resend OTP
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={resetPassword} className="auth-form">
            <input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            <input type="password" placeholder="Confirm Password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
            {error && <p className="error">{error}</p>}
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="auth-switch">
          <button onClick={() => navigate(ROUTES.LOGIN)}>Back to Sign In</button>
        </div>
      </div>
    </div>
    </>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "../api";

export default function LoginPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  async function handleLogin() {
    setError("");
    setSuccess(false);
    if (!email.trim())    return setError("Enter your email.");
    if (!password.trim()) return setError("Enter your password.");

    setLoading(true);
    try {
      const res = await authAPI.login(email.trim().toLowerCase(), password);
      localStorage.setItem("equal_token", res.data.access_token);

      const me = await authAPI.me();
      localStorage.setItem("equal_user", JSON.stringify(me.data));

      // Redirect to shell with token in URL
      setTimeout(() => {
        const shellUrl = `http://${window.location.hostname}:5170?token=${res.data.access_token}`;
        window.location.href = shellUrl;
      }, 500);
    } catch (e) {
      setError(e.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter") handleLogin();
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Heading */}
        <div style={styles.heading}>
          <div style={styles.title}>WELCOME BACK</div>
          <div style={styles.slogan}>COMPLEXITY IS THE ENEMY OF EXECUTION</div>
        </div>

        {/* Error */}
        {error && <div style={styles.errorBanner}>{error}</div>}

        {/* Success */}
        {success && <div style={{...styles.errorBanner, background: "#10b981", borderColor: "#059669"}}>✓ Login successful! Token saved.</div>}

        {/* Form card */}
        <div style={styles.card}>

          {/* Email */}
          <div>
            <div style={styles.fieldLabel}>EMAIL ADDRESS</div>
            <input
              style={styles.input}
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={handleKey}
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div>
            <div style={styles.fieldLabel}>PASSWORD</div>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...styles.input, paddingRight: "48px" }}
                type={showPass ? "text" : "password"}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKey}
                autoComplete="current-password"
              />
              <button
                style={styles.eyeBtn}
                onClick={() => setShowPass(v => !v)}
              >
                {showPass ? <EyeOff /> : <EyeOn />}
              </button>
            </div>
            <div style={{ textAlign: "right", marginTop: "6px" }}>
              <span style={{ fontSize: "9px", color: "#38bdf8", cursor: "pointer", letterSpacing: "1px" }}>
                FORGOT PASSWORD?
              </span>
            </div>
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer", marginTop: "4px" }}
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>

        </div>

        {/* Register link */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <span style={{ fontSize: "10px", color: "#5050a0" }}>Don't have an account? </span>
          <Link to="/register" style={{ fontSize: "10px", color: "#38bdf8", textDecoration: "none", letterSpacing: "1px" }}>CREATE ACCOUNT</Link>
        </div>

      </div>
    </div>
  );
}

function EyeOn() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="#5050a0" strokeWidth="1.2"/>
      <circle cx="8" cy="8" r="2" stroke="#5050a0" strokeWidth="1.2"/>
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="#5050a0" strokeWidth="1.2"/>
      <line x1="3" y1="3" x2="13" y2="13" stroke="#5050a0" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#05050e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 20px",
  },
  container: {
    width: "100%",
    maxWidth: "400px",
  },
  heading: {
    textAlign: "center",
    marginBottom: "32px",
  },
  title: {
    fontSize: "26px",
    fontWeight: "bold",
    color: "#e8e8ff",
    letterSpacing: "4px",
    marginBottom: "8px",
  },
  slogan: {
    fontSize: "11px",
    color: "#5050a0",
    letterSpacing: "3px",
  },
  errorBanner: {
    background: "#1a0606",
    border: "1px solid #ef444466",
    borderRadius: "8px",
    padding: "10px 14px",
    marginBottom: "16px",
    fontSize: "11px",
    color: "#f87171",
  },
  card: {
    background: "#0d0820",
    border: "1px solid #2e2e58",
    borderRadius: "14px",
    padding: "28px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
 fieldLabel: {
    fontSize: "11px",
    color: "#ffffff",
    fontWeight: "bold",
    letterSpacing: "1px",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    background: "#05050e",
    border: "1px solid #2e2e58",
    borderRadius: "8px",
    padding: "14px 16px",
    color: "#e8e8ff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
  },
  submitBtn: {
    width: "100%",
    background: "transparent",
    border: "2px solid #38bdf8",
    borderRadius: "10px",
    padding: "14px",
    color: "#38bdf8",
    fontSize: "15px",
    fontWeight: "bold",
    letterSpacing: "3px",
    cursor: "pointer",
  },
};
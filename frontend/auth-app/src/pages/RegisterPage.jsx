import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../api";
import { COUNTRIES, POPULAR_COUNTRIES, ALL_OTHER_COUNTRIES } from "../constants";

export default function RegisterPage() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    display_name:    "",
    email:           "",
    password:        "",
    confirmPassword: "",
    country:         "South Africa",
    currency_code:   "ZAR",
    currency_symbol: "R",
    agreed:          false,
  });

  const [showCountryList, setShowCountryList] = useState(false);
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [search,          setSearch]          = useState("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");

  const dropRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setShowCountryList(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function selectCountry(c) {
    setForm(f => ({
      ...f,
      country:         c.name,
      currency_code:   c.currency,
      currency_symbol: c.symbol,
    }));
    setShowCountryList(false);
    setSearch("");
  }

  const filtered = search.trim()
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  const selectedCountry = COUNTRIES.find(c => c.name === form.country) || COUNTRIES[0];

  async function handleSubmit() {
    setError("");
    if (!form.display_name.trim()) return setError("Enter a display name.");
    if (!form.email.trim())        return setError("Enter your email.");
    if (form.password.length < 8)  return setError("Password must be at least 8 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    if (!form.agreed)              return setError("You must agree to the terms.");

    setLoading(true);
    try {
      await authAPI.register({
        display_name:    form.display_name.trim(),
        email:           form.email.trim().toLowerCase(),
        password:        form.password,
        country:         form.country,
        currency_code:   form.currency_code,
        currency_symbol: form.currency_symbol,
      });

      const login = await authAPI.login(form.email.trim().toLowerCase(), form.password);
      localStorage.setItem("equal_token", login.data.access_token);

      const me = await authAPI.me();
      localStorage.setItem("equal_user", JSON.stringify(me.data));

      window.location.href = "http://localhost:5170";
    } catch (e) {
      const detail = e.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map(d => d.msg).join(", ")
        : typeof detail === "string"
        ? detail
        : "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Heading */}
        <div style={styles.heading}>
          <div style={styles.title}>CREATE ACCOUNT</div>
          <div style={styles.slogan}>COMPLEXITY IS THE ENEMY OF EXECUTION</div>
        </div>

        {/* Error */}
        {error && <div style={styles.errorBanner}>{error}</div>}

        {/* Form card */}
        <div style={styles.card}>

          {/* Display name */}
          <Field label="DISPLAY NAME">
            <input
              style={styles.input}
              placeholder="Your trading name"
              value={form.display_name}
              onChange={e => set("display_name", e.target.value)}
              autoComplete="off"
            />
          </Field>

          {/* Email */}
          <Field label="EMAIL ADDRESS">
            <input
              style={styles.input}
              type="email"
              placeholder="you@email.com"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              autoComplete="email"
            />
          </Field>

          {/* Password */}
          <Field label="PASSWORD">
            <div style={styles.inputWrap}>
              <input
                style={{ ...styles.input, paddingRight: "48px" }}
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={e => set("password", e.target.value)}
                autoComplete="new-password"
              />
              <button style={styles.eyeBtn} onClick={() => setShowPassword(v => !v)}>
                {showPassword ? <EyeOff /> : <EyeOn />}
              </button>
            </div>
          </Field>

          {/* Confirm password */}
          <Field label="CONFIRM PASSWORD">
            <div style={styles.inputWrap}>
              <input
                style={{
                  ...styles.input,
                  paddingRight: "48px",
                  borderColor: form.confirmPassword && form.password !== form.confirmPassword
                    ? "#ef4444" : "#2e2e58",
                }}
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={e => set("confirmPassword", e.target.value)}
                autoComplete="new-password"
              />
              <button style={styles.eyeBtn} onClick={() => setShowConfirm(v => !v)}>
                {showConfirm ? <EyeOff /> : <EyeOn />}
              </button>
            </div>
          </Field>

          {/* Country selector */}
          <div ref={dropRef}>
            <div style={styles.fieldLabel} >COUNTRY · SETS YOUR CURRENCY</div>

            <div style={styles.countryTrigger} onClick={() => setShowCountryList(v => !v)}>
              <span style={{ fontSize: "20px" }}>{selectedCountry.flag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", color: "#38bdf8", fontWeight: "bold" }}>{selectedCountry.name}</div>
                <div style={{ fontSize: "9px", color: "#5050a0", marginTop: "2px" }}>{selectedCountry.currency} · {selectedCountry.symbol}</div>
              </div>
              <ChevronDown />
            </div>

            {/* Currency pill */}
            <div style={styles.currencyPill}>
              <span style={{ fontSize: "9px", color: "#38bdf8" }}>
                All prices will display in {selectedCountry.currency} ({selectedCountry.symbol})
              </span>
            </div>

            {/* Dropdown */}
            {showCountryList && (
              <div style={styles.dropdown}>
                <div style={{ padding: "10px 12px", borderBottom: "1px solid #2e2e58" }}>
                  <input
                    style={{ ...styles.input, padding: "8px 12px", fontSize: "11px" }}
                    placeholder="Search country..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {!filtered && (
                    <>
                      <GroupLabel>POPULAR</GroupLabel>
                      {POPULAR_COUNTRIES.map(c => (
                        <CountryRow key={c.code} c={c} selected={form.country === c.name} onSelect={selectCountry} />
                      ))}
                      <GroupLabel>ALL COUNTRIES</GroupLabel>
                      {ALL_OTHER_COUNTRIES.map(c => (
                        <CountryRow key={c.code} c={c} selected={form.country === c.name} onSelect={selectCountry} />
                      ))}
                    </>
                  )}
                  {filtered && filtered.length === 0 && (
                    <div style={{ padding: "16px", textAlign: "center", fontSize: "11px", color: "#5050a0" }}>No results</div>
                  )}
                  {filtered && filtered.map(c => (
                    <CountryRow key={c.code} c={c} selected={form.country === c.name} onSelect={selectCountry} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Terms */}
          <div style={styles.checkRow} onClick={() => set("agreed", !form.agreed)}>
            <div style={{ ...styles.checkbox, borderColor: form.agreed ? "#38bdf8" : "#2e2e58", background: form.agreed ? "#061426" : "transparent" }}>
              {form.agreed && <CheckIcon />}
            </div>
            <span style={{ fontSize: "9px", color: "#5050a0", lineHeight: "1.6" }}>
              I agree to the <span style={{ color: "#38bdf8" }}>Terms of Service</span> and <span style={{ color: "#38bdf8" }}>Privacy Policy</span>. eQual is a simulation platform — no real money is involved.
            </span>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "CREATING..." : "CREATE ACCOUNT"}
          </button>

        </div>

        {/* Sign in link */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <span style={{ fontSize: "10px", color: "#5050a0" }}>Already have an account? </span>
          <Link to="/login" style={{ fontSize: "10px", color: "#38bdf8", textDecoration: "none", letterSpacing: "1px" }}>SIGN IN</Link>
        </div>

      </div>
    </div>
  );
}

// ── Sub components ────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <div style={styles.fieldLabel}>{label}</div>
      {children}
    </div>
  );
}

function GroupLabel({ children }) {
  return <div style={{ padding: "6px 12px 3px", fontSize: "8px", color: "#5050a0", letterSpacing: "1px" }}>{children}</div>;
}

function CountryRow({ c, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(c)}
      style={{
        padding: "9px 12px",
        display: "flex", alignItems: "center", gap: "10px",
        cursor: "pointer",
        background: selected ? "#061426" : "transparent",
        borderLeft: `3px solid ${selected ? "#38bdf8" : "transparent"}`,
      }}
    >
      <span style={{ fontSize: "16px" }}>{c.flag}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "11px", color: selected ? "#38bdf8" : "#c8c8ee", fontWeight: selected ? "bold" : "normal" }}>{c.name}</div>
        <div style={{ fontSize: "8px", color: "#5050a0", marginTop: "1px" }}>{c.currency} · {c.symbol}</div>
      </div>
      {selected && <CheckIcon color="#38bdf8" />}
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

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <polyline points="2,4 6,8 10,4" stroke="#5050a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CheckIcon({ color = "#38bdf8" }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10">
      <polyline points="2,5 4,7 8,3" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
    marginBottom: "28px",
  },
  title: {
    fontSize: "24px",
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
    letterSpacing: "0.5px",
  },
  card: {
    background: "#0d0820",
    border: "1px solid #2e2e58",
    borderRadius: "14px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
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
  inputWrap: {
    position: "relative",
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
  countryTrigger: {
    background: "#05050e",
    border: "1px solid #38bdf866",
    borderRadius: "8px",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer",
  },
  currencyPill: {
    marginTop: "6px",
    background: "#061426",
    border: "1px solid #38bdf822",
    borderRadius: "6px",
    padding: "7px 12px",
  },
  dropdown: {
    marginTop: "6px",
    background: "#0a0820",
    border: "1px solid #2e2e58",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
  },
  checkRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    cursor: "pointer",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    borderRadius: "4px",
    border: "1px solid #2e2e58",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: "1px",
  },
  submitBtn: {
    width: "100%",
    background: "transparent",
    border: "2px solid #38bdf8",
    borderRadius: "10px",
    padding: "14px",
    color: "#38bdf8",
    fontSize: "13px",
    fontWeight: "bold",
    letterSpacing: "3px",
    cursor: "pointer",
    marginTop: "4px",
  },
};
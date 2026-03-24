import { useState, useEffect } from "react";
import BottomNav from "../components/BottomNav";

/**
 * SimCounter simulates a live counter with small random fluctuations.
 * @param {number} base - Starting value.
 * @param {number} step - Maximum fluctuation per interval.
 * @param {number} interval - Update interval in ms.
 */
function SimCounter({ base, step = 3, interval = 900 }) {
  const [val, setVal] = useState(base);

  useEffect(() => {
    const id = setInterval(() => {
      setVal(v => v + Math.floor(Math.random() * step * 2) - Math.floor(step * 0.4));
    }, interval);
    return () => clearInterval(id);
  }, [step, interval]);

  return <span>{val.toLocaleString()}</span>;
}

/**
 * TypingSlogan displays a two-line animated typing effect.
 */
function TypingSlogan() {
  const text = "COMPLEXITY IS THE ENEMY OF EXECUTION";
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  const words = displayedText.split(" ");
  const firstLine = words.slice(0, 4).join(" ");
  const secondLine = words.slice(4).join(" ");

  return (
    <>
      <p style={{ fontSize: "13px", color: "#38bdf8", letterSpacing: "3px", textAlign: "center", margin: "0 0 6px", minHeight: "18px" }}>
        {firstLine}
      </p>
      <p style={{ fontSize: "13px", color: "#38bdf8", letterSpacing: "3px", textAlign: "center", margin: "0 0 32px", minHeight: "18px" }}>
        {secondLine}
      </p>
    </>
  );
}

/**
 * LandingPage displays the main shell content without any auth forms.
 */
export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#05050e", display: "flex", flexDirection: "column" }}>
      
      {/* Hero Section */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px 32px", position: "relative", background: "linear-gradient(180deg,#0a0820 0%,#05050e 100%)" }}>

        {/* Notification badge */}
        <div style={{ position: "absolute", top: "16px", right: "16px", background: "#7c3aed22", border: "1px solid #7c3aed55", borderRadius: "20px", padding: "4px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a78bfa" }} />
          <span style={{ fontSize: "11px", color: "#a78bfa", letterSpacing: "1px" }}>3 ALERTS</span>
        </div>

        {/* Logo text */}
        <svg viewBox="0 0 160 44" width="140" height="40" style={{ marginBottom: "24px" }}>
          <defs>
            <linearGradient id="eg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8"/>
              <stop offset="100%" stopColor="#0ea5c8"/>
            </linearGradient>
          </defs>
          <text x="0" y="36" fontFamily="Arial, Helvetica, sans-serif" fontSize="40" fontWeight="900" fill="url(#eg)">e</text>
          <text x="28" y="36" fontFamily="Arial, Helvetica, sans-serif" fontSize="40" fontWeight="900" fill="#e8e8ff">Q</text>
          <text x="62" y="36" fontFamily="Arial, Helvetica, sans-serif" fontSize="40" fontWeight="900" fill="#c8c8ee">ual</text>
        </svg>

        {/* Slogan */}
        <TypingSlogan />

        {/* Live stats */}
        <div style={{ width: "100%", background: "#0d0820", border: "1px solid #2e2e58", borderRadius: "10px", padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "24px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#4ade80", letterSpacing: "1px" }}>
              <SimCounter base={1247} step={5} interval={800} />
            </div>
            <div style={{ fontSize: "9px", color: "#5050a0", letterSpacing: "1px", marginTop: "2px" }}>ACTIVE TRADERS</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#facc15", letterSpacing: "1px" }}>
              R<SimCounter base={2400000} step={100000} interval={1000} />
            </div>
            <div style={{ fontSize: "9px", color: "#5050a0", letterSpacing: "1px", marginTop: "2px" }}>TODAY'S VOLUME</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "18px", fontWeight: "bold", color: "#38bdf8", letterSpacing: "1px" }}>#1</div>
            <div style={{ fontSize: "9px", color: "#5050a0", letterSpacing: "1px", marginTop: "2px" }}>SA PLATFORM</div>
          </div>
        </div>

        {/* AI Alert card */}
        <div style={{ width: "100%", background: "#0a0820", border: "1px solid #a78bfa44", borderRadius: "10px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }}
             onClick={() => window.location.href = "http://localhost:5172"}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#3b0764,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "12px", fontWeight: "bold", color: "#ddd6fe" }}>AI</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "10px", color: "#a78bfa", letterSpacing: "1px", marginBottom: "2px" }}>PETER · JUST NOW</div>
            <div style={{ fontSize: "11px", color: "#c8c8ee", lineHeight: "1.4" }}>USD/ZAR breakout forming — 89 pip opportunity detected</div>
          </div>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#a78bfa", flexShrink: 0 }} />
        </div>
      </div>

      {/* Bottom Nav */}
      <BottomNav active="home" />
    </div>
  );
}
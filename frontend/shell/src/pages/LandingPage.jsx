import { useState, useEffect } from "react";

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

const TILES = [
  {
    id: "bet", label: "Bet", color: "#ff4d00", route: "http://localhost:5175",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="11" stroke="#ff4d00" strokeWidth="1.5" opacity="0.4"/>
        <polyline points="7,19 10,13 13,16 17,9 21,12" stroke="#ff4d00" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="21" cy="8" r="2.5" fill="#ff4d00" opacity="0.8"/>
      </svg>
    ),
  },
  {
    id: "trade", label: "Trade", color: "#00ff88", route: "http://localhost:5173",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <polyline points="4,20 8,14 12,17 17,9 23,12" stroke="#00ff88" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="19,9 23,9 23,13" stroke="#00ff88" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="4" y1="23" x2="24" y2="23" stroke="#00ff88" strokeWidth="1" opacity="0.3"/>
      </svg>
    ),
  },
  {
    id: "arb", label: "Arb", color: "#ffdc00", route: "http://localhost:5174",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="7" cy="14" r="4" stroke="#ffdc00" strokeWidth="1.8"/>
        <circle cx="21" cy="14" r="4" stroke="#ffdc00" strokeWidth="1.8"/>
        <path d="M11 11.5 L17 9" stroke="#ffdc00" strokeWidth="1.5" strokeDasharray="2,2" strokeLinecap="round"/>
        <path d="M11 16.5 L17 19" stroke="#ffdc00" strokeWidth="1.5" strokeDasharray="2,2" strokeLinecap="round"/>
        <circle cx="7" cy="14" r="1.8" fill="#ffdc00" opacity="0.6"/>
        <circle cx="21" cy="14" r="1.8" fill="#ffdc00" opacity="0.6"/>
      </svg>
    ),
  },
  {
    id: "follow", label: "Follow", color: "#ff32b4", route: "http://localhost:5175",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="11" cy="10" r="4" stroke="#ff32b4" strokeWidth="1.8"/>
        <path d="M4 24c0-4.4 3.1-8 7-8" stroke="#ff32b4" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="20" cy="11" r="3" stroke="#ff32b4" strokeWidth="1.5"/>
        <path d="M16 22c0-2.7 1.8-4.5 4-4.5s4 1.8 4 4.5" stroke="#ff32b4" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="20" y1="5" x2="20" y2="8" stroke="#ff32b4" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "wallet", label: "Wallet", color: "#00c8ff", route: "http://localhost:5178",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="8" width="22" height="15" rx="3.5" stroke="#00c8ff" strokeWidth="1.8"/>
        <path d="M7 8V6.5A2.5 2.5 0 0 1 9.5 4h9A2.5 2.5 0 0 1 21 6.5V8" stroke="#00c8ff" strokeWidth="1.6"/>
        <rect x="18" y="13.5" width="7" height="5" rx="2" fill="rgba(0,200,255,0.15)" stroke="#00c8ff" strokeWidth="1.3"/>
        <circle cx="21.5" cy="16" r="1.2" fill="#00c8ff"/>
      </svg>
    ),
  },
  {
    id: "orbit", label: "Orbit", color: "#b450ff", route: "http://localhost:5177",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="4" fill="rgba(180,80,255,0.2)" stroke="#b450ff" strokeWidth="1.8"/>
        <ellipse cx="14" cy="14" rx="11" ry="5" stroke="#b450ff" strokeWidth="1.3" strokeDasharray="3,2" transform="rotate(-30 14 14)" opacity="0.7"/>
        <circle cx="22.5" cy="9.5" r="2" fill="#b450ff" opacity="0.9"/>
        <circle cx="14" cy="14" r="1.8" fill="#b450ff"/>
      </svg>
    ),
  },
  {
    id: "market", label: "Market", color: "#ffb400", route: "http://localhost:5173",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="13" width="22" height="12" rx="3" stroke="#ffb400" strokeWidth="1.8"/>
        <path d="M7 13V11a7 7 0 0 1 14 0v2" stroke="#ffb400" strokeWidth="1.7"/>
        <circle cx="14" cy="19" r="2.5" fill="rgba(255,180,0,0.2)" stroke="#ffb400" strokeWidth="1.5"/>
        <line x1="14" y1="17" x2="14" y2="21" stroke="#ffb400" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "alerts", label: "Alerts", color: "#ff3250", route: "http://localhost:5179", badge: 10,
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4a8 8 0 0 1 8 8v4.5l2 3H4l2-3V12a8 8 0 0 1 8-8z" stroke="#ff3250" strokeWidth="1.8"/>
        <path d="M11 22.5a3 3 0 0 0 6 0" stroke="#ff3250" strokeWidth="1.6"/>
        <line x1="14" y1="4" x2="14" y2="2" stroke="#ff3250" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="14" cy="12" r="2" fill="#ff3250" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: "profile", label: "Profile", color: "#50b4ff", route: "http://localhost:5176",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="10" r="5" stroke="#50b4ff" strokeWidth="1.8"/>
        <path d="M4 26c0-5.5 4.5-10 10-10s10 4.5 10 10" stroke="#50b4ff" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="14" cy="10" r="2.5" fill="rgba(80,180,255,0.3)"/>
      </svg>
    ),
  },
];

export default function LandingPage() {
  const [hovered, setHovered] = useState(null);

  function handleNav(tile) {
    const token = localStorage.getItem("equal_token");
    window.location.href = `${tile.route}?token=${token}&tab=${tile.id}`;
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#03020a",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'Courier New', monospace", position: "relative", overflow: "hidden",
    }}>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseGlow { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes nodePop { from{opacity:0;transform:scale(0.6)} to{opacity:1;transform:scale(1)} }
        .nav-tile { transition: all 0.22s ease; }
        .nav-tile:active { transform: scale(0.92) !important; }
      `}</style>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,200,255,0.06),transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: 100, right: -60, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle,rgba(180,80,255,0.06),transparent 70%)" }} />
        <div style={{ position: "absolute", top: "40%", left: "30%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,255,136,0.04),transparent 70%)" }} />
      </div>

      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", animation: "fadeUp 0.5s ease both" }}>
          <svg viewBox="0 0 120 32" width="90" height="26">
            <defs>
              <linearGradient id="eg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00c8ff"/>
                <stop offset="100%" stopColor="#0ea5c8"/>
              </linearGradient>
            </defs>
            <text x="0" y="26" fontFamily="Arial" fontSize="30" fontWeight="900" fill="url(#eg)">e</text>
            <text x="19" y="26" fontFamily="Arial" fontSize="30" fontWeight="900" fill="#eeeeff">Q</text>
            <text x="43" y="26" fontFamily="Arial" fontSize="30" fontWeight="900" fill="#aaaacc">ual</text>
          </svg>
          <div style={{ background: "rgba(255,50,80,0.12)", border: "1px solid rgba(255,50,80,0.4)", borderRadius: 20, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ff3250", boxShadow: "0 0 6px #ff3250", animation: "pulseGlow 1.5s ease infinite" }} />
            <span style={{ fontSize: 9, color: "#ff3250", letterSpacing: "1px" }}>10 ALERTS</span>
          </div>
        </div>

        {/* Slogan */}
        <div style={{ padding: "10px 20px 0", animation: "fadeUp 0.5s ease 0.1s both", opacity: 0 }}>
          <p style={{ fontSize: 9, color: "rgba(0,200,255,0.55)", letterSpacing: "2.5px", margin: 0 }}>
            COMPLEXITY IS THE ENEMY OF EXECUTION
          </p>
        </div>

        {/* AI alert */}
        <div onClick={() => window.location.href = "http://localhost:5172"} style={{
          margin: "14px 16px 0",
          background: "linear-gradient(135deg,rgba(180,80,255,0.08),rgba(0,200,255,0.06))",
          border: "1px solid rgba(180,80,255,0.3)", borderRadius: 16, padding: "12px 14px",
          display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
          animation: "fadeUp 0.5s ease 0.2s both", opacity: 0,
        }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg,#3b0764,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: "bold", color: "#ddd6fe", flexShrink: 0, boxShadow: "0 0 14px rgba(109,40,217,0.4)" }}>AI</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 8, color: "#a78bfa", letterSpacing: "1px", marginBottom: 3 }}>PETER · JUST NOW</div>
            <div style={{ fontSize: 11, color: "#e0e0ff", lineHeight: 1.4 }}>USD/ZAR breakout forming — 89 pip opportunity detected</div>
          </div>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#a78bfa", boxShadow: "0 0 10px #a78bfa", flexShrink: 0 }} />
        </div>

        {/* Live stats */}
        <div style={{ margin: "12px 16px 0", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, animation: "fadeUp 0.5s ease 0.3s both", opacity: 0 }}>
          {[
            { val: <SimCounter base={1247} step={5} interval={800} />, label: "TRADERS", color: "#00ff88" },
            { val: <>R<SimCounter base={641882911} step={50000} interval={1200} /></>, label: "VOLUME", color: "#ffdc00", small: true },
            { val: "#1", label: "AFRICA", color: "#00c8ff" },
          ].map((s, i) => (
            <div key={i} style={{ background: `rgba(${s.color === "#00ff88" ? "0,255,136" : s.color === "#ffdc00" ? "255,220,0" : "0,200,255"},0.05)`, border: `1px solid ${s.color}33`, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: s.small ? 12 : 15, fontWeight: "bold", color: s.color, letterSpacing: "0.5px" }}>{s.val}</div>
              <div style={{ fontSize: 7, color: `${s.color}77`, letterSpacing: "1px", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Nav label */}
        <div style={{ padding: "18px 20px 10px", animation: "fadeUp 0.4s ease 0.35s both", opacity: 0 }}>
          <p style={{ fontSize: 8, color: "rgba(255,255,255,0.22)", letterSpacing: "3px", margin: 0 }}>NAVIGATE</p>
        </div>

        {/* 3×3 Nav Grid */}
        <div style={{ padding: "0 12px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, animation: "fadeUp 0.5s ease 0.4s both", opacity: 0 }}>
          {TILES.map((tile, i) => {
            const isHov = hovered === tile.id;
            const rgb = tile.color.replace("#","").match(/.{2}/g).map(h=>parseInt(h,16)).join(",");
            return (
              <div key={tile.id}
                className="nav-tile"
                onClick={() => handleNav(tile)}
                onMouseEnter={() => setHovered(tile.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                  cursor: "pointer", borderRadius: 20, padding: "16px 8px 12px",
                  background: isHov ? `rgba(${rgb},0.16)` : `rgba(${rgb},0.08)`,
                  border: `1px solid rgba(${rgb},${isHov ? 0.7 : 0.35})`,
                  boxShadow: isHov ? `0 0 24px rgba(${rgb},0.25),inset 0 0 16px rgba(${rgb},0.08)` : "none",
                  position: "relative", overflow: "hidden",
                  animation: `nodePop 0.4s ease ${0.05 + i * 0.04}s both`,
                  transform: isHov ? "translateY(-2px)" : "translateY(0)",
                }}>
                {/* Badge */}
                {tile.badge && (
                  <div style={{ position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: tile.color, fontSize: 8, fontWeight: "bold", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: "1.5px solid #03020a", boxShadow: `0 0 8px ${tile.color}` }}>
                    {tile.badge}
                  </div>
                )}
                {/* Icon wrap */}
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `rgba(${rgb},0.1)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  {tile.icon}
                  <div style={{ position: "absolute", inset: 0, borderRadius: 16, background: `radial-gradient(circle at 50% 50%,rgba(${rgb},0.15),transparent 70%)` }} />
                </div>
                <span style={{ fontSize: 9, letterSpacing: "2px", fontWeight: 700, textTransform: "uppercase", color: isHov ? tile.color : tile.color + "99", textShadow: isHov ? `0 0 8px ${tile.color}` : "none", transition: "all 0.2s" }}>
                  {tile.label}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Bottom Home Nav */}
        <div style={{ background: "rgba(3,2,10,0.95)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(0,200,255,0.12)", padding: "10px 0 max(14px,env(safe-area-inset-bottom))", display: "flex", justifyContent: "center", animation: "fadeUp 0.4s ease 0.6s both", opacity: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: "rgba(0,200,255,0.12)", border: "1px solid rgba(0,200,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(0,200,255,0.2)" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 10.5L10 3l7 7.5" stroke="#00c8ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="6" y="10" width="8" height="7" rx="1.5" stroke="#00c8ff" strokeWidth="1.6"/>
                <line x1="8.5" y1="17" x2="8.5" y2="14" stroke="#00c8ff" strokeWidth="1.3" strokeLinecap="round"/>
                <line x1="11.5" y1="17" x2="11.5" y2="14" stroke="#00c8ff" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 7, letterSpacing: "2px", color: "#00c8ff", fontWeight: 700 }}>HOME</span>
            <div style={{ width: 20, height: 2, background: "#00c8ff", borderRadius: 1, boxShadow: "0 0 8px #00c8ff" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

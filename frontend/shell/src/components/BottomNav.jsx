const TABS = [
  { id: "bet",     label: "BET",     route: "http://localhost:5175", color: "#f97316" },
  { id: "trade",   label: "TRADE",   route: "http://localhost:5172", color: "#4ade80" },
  { id: "arb",     label: "ARB",     route: "http://localhost:5173", color: "#facc15" },
  { id: "follow",  label: "FOLLOW",  route: "http://localhost:5174", color: "#f472b6" },
  { id: "profile", label: "PROFILE", route: "http://localhost:5176", color: "#38bdf8" },
];

const ICONS = {
  bet: (a) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" stroke={a ? "#f97316" : "#3a3a60"} strokeWidth="1.4"/>
      <polyline points="5,12 7,8 9,10 12,5" stroke={a ? "#f97316" : "#3a3a60"} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  trade: (a) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <polyline points="2,13 5,9 8,11 12,5 16,7" stroke={a ? "#4ade80" : "#3a3a60"} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  arb: (a) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="4"  cy="9" r="2.5" stroke={a ? "#facc15" : "#3a3a60"} strokeWidth="1.3"/>
      <circle cx="14" cy="9" r="2.5" stroke={a ? "#facc15" : "#3a3a60"} strokeWidth="1.3"/>
      <line x1="6.5" y1="7.5" x2="11.5" y2="6"  stroke={a ? "#facc15" : "#3a3a60"} strokeWidth="1" strokeDasharray="2,1.5"/>
      <line x1="6.5" y1="10.5" x2="11.5" y2="12" stroke={a ? "#facc15" : "#3a3a60"} strokeWidth="1" strokeDasharray="2,1.5"/>
    </svg>
  ),
  follow: (a) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="7" cy="7" r="3" stroke={a ? "#f472b6" : "#3a3a60"} strokeWidth="1.3"/>
      <path d="M2 16c0-2.8 2.2-5 5-5" stroke={a ? "#f472b6" : "#3a3a60"} strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="13" cy="8" r="2" stroke={a ? "#f472b6" : "#3a3a60"} strokeWidth="1.2"/>
      <path d="M10 16c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke={a ? "#f472b6" : "#3a3a60"} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  profile: (a) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="7" r="3.5" stroke={a ? "#38bdf8" : "#3a3a60"} strokeWidth="1.3"/>
      <path d="M2 17c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={a ? "#38bdf8" : "#3a3a60"} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
};

export default function BottomNav({ active = "home", setActive }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%",
      transform: "translateX(-50%)",
      width: "100%", maxWidth: "480px",
      background: "#07070f",
      borderTop: "1px solid #1e1e3a",
      padding: "8px 0 max(12px, env(safe-area-inset-bottom))",
      zIndex: 100,
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
    }}>
      {TABS.map(tab => {
        const isActive = active === tab.id;
        return (
          <div
            key={tab.id}
            onClick={() => setActive?.(tab.id)}  // <- updated
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "8px 4px", cursor: "pointer", position: "relative" }}
          >
            <div style={{
              width: "32px", height: "32px", borderRadius: "10px",
              background: isActive ? `${tab.color}22` : "#0d0d20",
              border: `1px solid ${isActive ? tab.color + "66" : "#2e2e58"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {ICONS[tab.id](isActive)}
            </div>
            <span style={{
              fontSize: "7px", letterSpacing: "0.5px",
              color: isActive ? tab.color : "#3a3a60",
              fontWeight: isActive ? "bold" : "normal",
            }}>
              {tab.label}
            </span>
            {isActive && (
              <div style={{ position: "absolute", bottom: 0, width: "20px", height: "2px", background: tab.color, borderRadius: "1px" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
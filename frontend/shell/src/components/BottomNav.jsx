import { useEffect, useState } from "react";

const TABS = [
  { id: "bet",     label: "BET",     route: "http://localhost:5175", color: "#f97316" },
  { id: "trade",   label: "TRADE",   route: "http://localhost:5173", color: "#28a745" },
  { id: "arb",     label: "ARB",     route: "http://localhost:5174", color: "#f5a623" },
  { id: "follow",  label: "FOLLOW",  route: "http://localhost:5175", color: "#e83e8c" },
  { id: "profile", label: "PROFILE", route: "http://localhost:5177", color: "#007bff" },
];

const ICONS = {
  bet: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" stroke={active ? "#f97316" : "#adb5bd"} strokeWidth="1.4"/>
      <polyline points="5,12 7,8 9,10 12,5" stroke={active ? "#f97316" : "#adb5bd"} strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  trade: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <polyline points="2,13 5,9 8,11 12,5 16,7" stroke={active ? "#28a745" : "#adb5bd"} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  arb: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="4" cy="9" r="2.5" stroke={active ? "#f5a623" : "#adb5bd"} strokeWidth="1.3"/>
      <circle cx="14" cy="9" r="2.5" stroke={active ? "#f5a623" : "#adb5bd"} strokeWidth="1.3"/>
      <line x1="6.5" y1="7.5" x2="11.5" y2="6" stroke={active ? "#f5a623" : "#adb5bd"} strokeWidth="1" strokeDasharray="2,1.5"/>
      <line x1="6.5" y1="10.5" x2="11.5" y2="12" stroke={active ? "#f5a623" : "#adb5bd"} strokeWidth="1" strokeDasharray="2,1.5"/>
    </svg>
  ),
  follow: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="7" cy="7" r="3" stroke={active ? "#e83e8c" : "#adb5bd"} strokeWidth="1.3"/>
      <path d="M2 16c0-2.8 2.2-5 5-5" stroke={active ? "#e83e8c" : "#adb5bd"} strokeWidth="1.3" strokeLinecap="round"/>
      <circle cx="13" cy="8" r="2" stroke={active ? "#e83e8c" : "#adb5bd"} strokeWidth="1.2"/>
      <path d="M10 16c0-1.7 1.3-3 3-3s3 1.3 3 3" stroke={active ? "#e83e8c" : "#adb5bd"} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  profile: (active) => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="7" r="3.5" stroke={active ? "#007bff" : "#adb5bd"} strokeWidth="1.3"/>
      <path d="M2 17c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={active ? "#007bff" : "#adb5bd"} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
};

export default function BottomNav({ active }) {
  const [currentTab, setCurrentTab] = useState(active || "bet");

  useEffect(() => {
    if (!active) {
      const stored = localStorage.getItem("active_tab");
      if (stored) setCurrentTab(stored);
    } else {
      setCurrentTab(active);
    }
  }, [active]);

  function handleNav(tab) {
    const token = localStorage.getItem("equal_token");
    localStorage.setItem("active_tab", tab.id);
    window.location.href = `${tab.route}?token=${token}&tab=${tab.id}`;
  }

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: "clamp(320px, 100%, 480px)",
      background: "#ffffff",
      borderTop: "1px solid #e0e4e8",
      padding: "clamp(6px, 2vw, 8px) 0 max(12px, env(safe-area-inset-bottom))",
      zIndex: 100,
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
    }}>
      {TABS.map(tab => {
        const isActive = currentTab === tab.id;

        return (
          <div
            key={tab.id}
            onClick={() => handleNav(tab)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "clamp(2px, 1vw, 4px)",
              padding: "clamp(6px, 2vw, 8px) clamp(2px, 1vw, 4px)",
              cursor: "pointer",
              position: "relative",
              minHeight: "44px",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{
              width: "clamp(28px, 8vw, 32px)",
              height: "clamp(28px, 8vw, 32px)",
              borderRadius: "10px",
              background: isActive ? `${tab.color}15` : "#f8f9fa",
              border: `1px solid ${isActive ? tab.color : "#e0e4e8"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}>
              {ICONS[tab.id](isActive)}
            </div>

            <span style={{
              fontSize: "clamp(6px, 2vw, 7px)",
              letterSpacing: "0.5px",
              color: isActive ? tab.color : "#adb5bd",
              fontWeight: isActive ? "bold" : "normal",
            }}>
              {tab.label}
            </span>

            {isActive && (
              <div style={{
                position: "absolute",
                bottom: "clamp(2px, 1vw, 4px)",
                width: "clamp(16px, 5vw, 20px)",
                height: "2px",
                background: tab.color,
                borderRadius: "1px",
                boxShadow: `0 0 8px ${tab.color}`,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

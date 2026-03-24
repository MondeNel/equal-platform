import { useState, useEffect } from "react";
import BottomNav from "../components/BottomNav";
import { walletAPI } from "../api";
import { getUser, formatCurrency, getGreeting } from "../utils";

function SimCounter({ base, step = 3, interval = 900 }) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const id = setInterval(() => setVal(v => v + Math.floor(Math.random() * step * 2) - Math.floor(step * 0.4)), interval);
    return () => clearInterval(id);
  }, []);
  return <span>{val.toLocaleString()}</span>;
}

export default function LandingPage() {
  const user = getUser();
  const sym  = user?.currency_symbol || "R";

  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    walletAPI.get()
      .then(r => setBalance(r.data.balance))
      .catch(() => setBalance(0))
      .finally(() => setLoading(false));
  }, []);

  const initials = (user?.display_name || user?.email || "U")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ minHeight: "100vh", background: "#05050e", paddingBottom: "90px" }}>

      {/* Header */}
      <div style={{ padding: "20px 20px 16px", background: "linear-gradient(180deg,#0a0820 0%,#05050e 100%)", borderBottom: "1px solid #1e1e3a" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <svg viewBox="0 0 160 44" width="80" height="22">
            <defs>
              <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8"/>
                <stop offset="100%" stopColor="#0ea5c8"/>
              </linearGradient>
            </defs>
            <text x="2"  y="34" fontFamily="Georgia,serif" fontSize="36" fontWeight="400" fontStyle="italic" fill="url(#lg)">e</text>
            <text x="24" y="34" fontFamily="Georgia,serif" fontSize="36" fontWeight="700" fill="#e8e8ff">Q</text>
            <text x="55" y="34" fontFamily="Georgia,serif" fontSize="36" fontWeight="400" fill="#c8c8ee">ual</text>
          </svg>

          {/* Avatar */}
          <div
            onClick={() => window.location.href = "http://localhost:5176"}
            style={{ width: "38px", height: "38px", borderRadius: "50%", background: "linear-gradient(135deg,#38bdf8,#0ea5c8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px", color: "#05050e", cursor: "pointer" }}
          >
            {initials}
          </div>
        </div>

        {/* Greeting */}
        <div style={{ marginTop: "16px" }}>
          <div style={{ fontSize: "11px", color: "#5050a0", letterSpacing: "1px", marginBottom: "3px" }}>
            GOOD {getGreeting()},
          </div>
          <div style={{ fontSize: "22px", fontWeight: "bold", color: "#e8e8ff", letterSpacing: "1px" }}>
            {user?.display_name || user?.email?.split("@")[0] || "Trader"}
          </div>
        </div>
      </div>

      {/* Balance card */}
      <div style={{ margin: "16px 16px 0", background: "linear-gradient(135deg,#061426,#082040)", border: "1px solid #38bdf844", borderRadius: "16px", padding: "20px" }}>
        <div style={{ fontSize: "9px", color: "#38bdf888", letterSpacing: "2px", marginBottom: "6px" }}>SIMULATED BALANCE</div>
        <div style={{ fontSize: "32px", fontWeight: "bold", color: "#38bdf8", letterSpacing: "1px", marginBottom: "4px" }}>
          {loading ? "..." : formatCurrency(balance)}
        </div>
        <div style={{ fontSize: "9px", color: "#5050a0", letterSpacing: "1px" }}>
          {user?.country || "South Africa"} · {user?.currency_code || "ZAR"}
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
          <QuickBtn label="TRADE"  color="#38bdf8" onClick={() => window.location.href = "http://localhost:5172"} />
          <QuickBtn label="ARB"    color="#facc15" onClick={() => window.location.href = "http://localhost:5173"} />
          <QuickBtn label="FOLLOW" color="#f472b6" onClick={() => window.location.href = "http://localhost:5174"} />
        </div>
      </div>

      {/* Live stats */}
      <div style={{ margin: "12px 16px 0", background: "#0a0a1e", border: "1px solid #1e1e3a", borderRadius: "12px", padding: "14px 16px" }}>
        <div style={{ fontSize: "8px", color: "#5050a0", letterSpacing: "2px", marginBottom: "12px" }}>PLATFORM · LIVE</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", textAlign: "center" }}>
          <StatPill label="ACTIVE TRADERS" value={<SimCounter base={1247} step={5} interval={800} />}  color="#4ade80" />
          <StatPill label="TODAY'S TRADES"  value={<SimCounter base={8392} step={12} interval={600} />} color="#38bdf8" />
          <StatPill label="TOP P&L TODAY"   value={`${sym}142K`} color="#facc15" />
        </div>
      </div>

      {/* Peter AI alert */}
      <div
        onClick={() => window.location.href = "http://localhost:5172"}
        style={{ margin: "12px 16px 0", background: "#0a0820", border: "1px solid #a78bfa44", borderRadius: "12px", padding: "14px 16px", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg,#3b0764,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", color: "#ddd6fe", flexShrink: 0 }}>AI</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "9px", color: "#a78bfa", letterSpacing: "1px", marginBottom: "4px" }}>PETER AI · MARKET ALERT</div>
            <div style={{ fontSize: "12px", color: "#c8c8ee", lineHeight: "1.5" }}>
              USD/ZAR approaching key resistance. Breakout setup forming — 68 pip opportunity.
            </div>
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polyline points="2,6 10,6" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round"/>
            <polyline points="6,2 10,6 6,10" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a78bfa" }} />
          <span style={{ fontSize: "8px", color: "#5050a0", letterSpacing: "1px" }}>TAP TO ANALYSE WITH PETER</span>
        </div>
      </div>

      {/* Market snapshot */}
      <div style={{ margin: "12px 16px 0" }}>
        <div style={{ fontSize: "9px", color: "#5050a0", letterSpacing: "2px", marginBottom: "10px" }}>MARKET SNAPSHOT</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <MarketRow symbol="BTC/USD" change="+2.4%" up={true}  />
          <MarketRow symbol="USD/ZAR" change="-0.3%" up={false} />
          <MarketRow symbol="ETH/USD" change="+1.1%" up={true}  />
          <MarketRow symbol="APPLE"   change="+0.8%" up={true}  />
        </div>
      </div>

      {/* Leaderboard teaser */}
      <div style={{ margin: "12px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <div style={{ fontSize: "9px", color: "#5050a0", letterSpacing: "2px" }}>TOP TRADERS TODAY</div>
          <span
            onClick={() => window.location.href = "http://localhost:5174"}
            style={{ fontSize: "9px", color: "#f472b6", letterSpacing: "1px", cursor: "pointer" }}
          >SEE ALL</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <LeaderRow rank={1} name="TheboKing"  pnl={`+${sym}14,200`} rate="94%" />
          <LeaderRow rank={2} name="ForexFundi" pnl={`+${sym}9,800`}  rate="88%" />
          <LeaderRow rank={3} name="CryptoZA"   pnl={`+${sym}7,400`}  rate="81%" />
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  );
}

// ── Sub components ─────────────────────────────────────────────────────────────

function QuickBtn({ label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, background: `${color}22`, border: `1px solid ${color}66`,
      borderRadius: "8px", padding: "10px",
      fontSize: "11px", color, letterSpacing: "1px", fontWeight: "bold",
      cursor: "pointer",
    }}>
      {label}
    </button>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: "16px", fontWeight: "bold", color }}>{value}</div>
      <div style={{ fontSize: "7px", color: "#5050a0", letterSpacing: "1px", marginTop: "3px" }}>{label}</div>
    </div>
  );
}

function MarketRow({ symbol, change, up }) {
  return (
    <div style={{ background: "#0d0d1a", border: "1px solid #1e1e3a", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
      onClick={() => window.location.href = "http://localhost:5172"}
    >
      <span style={{ fontSize: "12px", color: "#c8c8ee", letterSpacing: "1px" }}>{symbol}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "11px", color: up ? "#4ade80" : "#f87171", fontWeight: "bold" }}>{change}</span>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: up ? "#4ade80" : "#f87171" }} />
      </div>
    </div>
  );
}

function LeaderRow({ rank, name, pnl, rate }) {
  const rankColor = rank === 1 ? "#facc15" : rank === 2 ? "#c0c0c0" : "#cd7f32";
  return (
    <div style={{ background: "#0d0d1a", border: "1px solid #1e1e3a", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: `${rankColor}22`, border: `1px solid ${rankColor}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold", color: rankColor, flexShrink: 0 }}>
        {rank}
      </div>
      <div style={{ flex: 1, fontSize: "12px", color: "#c8c8ee" }}>{name}</div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "12px", color: "#4ade80", fontWeight: "bold" }}>{pnl}</div>
        <div style={{ fontSize: "8px", color: "#5050a0", marginTop: "1px" }}>{rate} WIN</div>
      </div>
    </div>
  );
}
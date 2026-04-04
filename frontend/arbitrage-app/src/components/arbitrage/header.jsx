import { Bot } from "lucide-react";

export function Header({ aiScanningEnabled, onToggleAiScanning }) {
  return (
    <header className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between max-w-md mx-auto">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold tracking-wider" style={{ color: "var(--arb-yellow)" }}>
            ARBITRAGE
          </h1>
          <nav className="flex gap-3 text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>
            <span className="hover:text-foreground cursor-pointer">BUY LOW</span>
            <span style={{ color: "var(--arb-magenta)" }}>-</span>
            <span className="hover:text-foreground cursor-pointer">SELL HIGH</span>
            <span style={{ color: "var(--arb-magenta)" }}>-</span>
            <span className="hover:text-foreground cursor-pointer">ACROSS EXCHANGES</span>
          </nav>
        </div>
        
        <div className="flex items-center gap-2 border rounded-full px-3 py-1.5" style={{ borderColor: "var(--arb-cyan)" }}>
          <Bot className="w-4 h-4" style={{ color: "var(--arb-cyan)" }} />
          <span className="text-xs" style={{ color: "var(--arb-cyan)" }}>AI SCANNING</span>
          <button
            onClick={onToggleAiScanning}
            className={`w-8 h-4 rounded-full transition-colors ${aiScanningEnabled ? 'bg-cyan-500' : 'bg-gray-600'}`}
          >
            <div className={`w-3 h-3 rounded-full bg-white transition-transform ${aiScanningEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </header>
  );
}

import { AlertCircle } from "lucide-react";

export function TransactionBreakdown({ breakdown, opportunity }) {
  const formatCurrency = (value) => {
    const num = parseFloat(value) || 0;
    const prefix = num >= 0 ? "+" : "";
    return `${prefix}R${Math.abs(num).toLocaleString()}`;
  };

  const isProfit = parseFloat(breakdown.estimatedProfit) > 0;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "var(--border)", opacity: 0.5 }}>
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Coins (BTC)</span>
          <span className="text-sm font-mono" style={{ color: "var(--foreground)" }}>{breakdown.coins}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "var(--border)", opacity: 0.5 }}>
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Spread Value</span>
          <span className="text-sm font-mono" style={{ color: "var(--foreground)" }}>
            R{parseFloat(breakdown.spreadValue).toLocaleString()} / R{((opportunity?.spread_percent || 0) * 1000).toFixed(0).toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: "var(--border)", opacity: 0.5 }}>
          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Est. Fees</span>
          <span className="text-sm font-mono" style={{ color: "var(--arb-red)" }}>
            - R{parseFloat(breakdown.fee).toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between items-center py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>Estimated Profit</span>
            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>(After fees - Based on current spread)</span>
          </div>
          <span className={`text-lg font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}>
            {formatCurrency(breakdown.estimatedProfit)}
          </span>
        </div>
      </div>
      
      <div className="flex items-start gap-2 p-3 rounded-lg border" style={{ background: "rgba(250,204,21,0.1)", borderColor: "rgba(250,204,21,0.3)" }}>
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--arb-yellow)" }} />
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Arbitrage windows close fast. Spread may change by the time your order executes.
        </p>
      </div>
    </div>
  );
}

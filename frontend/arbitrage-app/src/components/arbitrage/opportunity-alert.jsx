import { Bot, ChevronRight } from "lucide-react";

export function OpportunityAlert({ opportunity }) {
  if (!opportunity) return null;

  const formatSpread = (value) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="rounded-lg p-3 animate-border-glow" style={{ background: "rgba(59,130,246,0.2)", borderColor: "var(--arb-blue)" }}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(59,130,246,0.3)" }}>
          <Bot className="w-4 h-4" style={{ color: "var(--arb-cyan)" }} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--arb-cyan)" }}>
            FOREX - Opportunity detected
          </p>
          <p className="text-sm" style={{ color: "var(--foreground)" }}>
            {opportunity.symbol} spread of{" "}
            <span className="font-semibold" style={{ color: "var(--arb-yellow)" }}>
              {formatSpread(opportunity.spread_zar || 0)}
            </span>{" "}
            found between{" "}
            <span style={{ color: "var(--arb-cyan)" }}>{opportunity.buy_exchange}</span>
            {" "}and{" "}
            <span style={{ color: "var(--arb-magenta)" }}>{opportunity.sell_exchange}</span>
          </p>
        </div>
        
        <button className="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-opacity" style={{ color: "var(--arb-yellow)" }}>
          APPLY
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

const PRESET_AMOUNTS = [
  { label: "R500", value: 500 },
  { label: "R1K", value: 1000 },
  { label: "R2.5K", value: 2500 },
  { label: "R5K", value: 5000 },
];

export function AmountInput({ amount, onAmountChange, maxAmount }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
          Amount (ZAR)
        </p>
        <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
          ZAR TO SPEND
        </p>
      </div>
      
      <div className="rounded-lg p-4" style={{ background: "var(--muted)" }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl font-bold" style={{ color: "var(--arb-yellow)" }}>ZAR</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(parseFloat(e.target.value) || 0)}
            className="bg-transparent border-none text-3xl font-bold text-foreground h-auto p-0 focus:outline-none"
            style={{ width: `${Math.max(100, amount.toString().length * 20)}px` }}
          />
        </div>
        
        <div className="flex gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onAmountChange(preset.value)}
              className={`flex-1 py-2 px-3 rounded text-xs font-semibold transition-all border ${
                amount === preset.value
                  ? "text-background"
                  : "hover:bg-yellow-500/10"
              }`}
              style={{
                background: amount === preset.value ? "var(--arb-yellow)" : "transparent",
                color: amount === preset.value ? "var(--background)" : "var(--arb-yellow)",
                borderColor: "var(--arb-yellow)"
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const MARKETS = [
  { value: "crypto", label: "Crypto" },
  { value: "forex", label: "Forex" },
  { value: "stocks", label: "Stocks" },
];

const SYMBOLS = {
  crypto: [
    { value: "BTC/ZAR", label: "BTC/ZAR" },
    { value: "ETH/ZAR", label: "ETH/ZAR" },
    { value: "XRP/ZAR", label: "XRP/ZAR" },
    { value: "SOL/ZAR", label: "SOL/ZAR" },
  ],
  forex: [
    { value: "USD/ZAR", label: "USD/ZAR" },
    { value: "EUR/ZAR", label: "EUR/ZAR" },
    { value: "GBP/ZAR", label: "GBP/ZAR" },
  ],
  stocks: [
    { value: "NPN/ZAR", label: "NPN/ZAR" },
    { value: "SOL/ZAR", label: "SOL/ZAR" },
  ],
};

export function MarketSelector({ market, symbol, onMarketChange, onSymbolChange }) {
  const availableSymbols = SYMBOLS[market] || SYMBOLS.crypto;

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
            Market
          </label>
          <select
            value={market}
            onChange={(e) => onMarketChange(e.target.value)}
            className="w-full h-10 px-3 rounded border text-foreground"
            style={{ background: "var(--muted)", borderColor: "var(--border)" }}
          >
            {MARKETS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        
        <div className="flex-1">
          <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
            Symbol
          </label>
          <select
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
            className="w-full h-10 px-3 rounded font-semibold"
            style={{ background: "var(--arb-yellow)", color: "var(--background)", border: "none" }}
          >
            {availableSymbols.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

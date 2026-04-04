export function OrderTypeSelector({ orderType, onOrderTypeChange, limitPrice, onLimitPriceChange }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
        Order Type
      </p>
      
      <div className="rounded-lg p-1 flex" style={{ background: "var(--muted)" }}>
        <button
          onClick={() => onOrderTypeChange("market")}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all ${
            orderType === "market"
              ? "text-background" 
              : "hover:text-foreground"
          }`}
          style={{
            background: orderType === "market" ? "var(--arb-yellow)" : "transparent",
            color: orderType === "market" ? "var(--background)" : "var(--muted-foreground)"
          }}
        >
          <div className="flex flex-col items-center">
            <span>MARKET ORDER</span>
            <span className="text-[10px] font-normal opacity-70">Execute now</span>
          </div>
        </button>
        
        <button
          onClick={() => onOrderTypeChange("limit")}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all ${
            orderType === "limit"
              ? "text-background"
              : "hover:text-foreground"
          }`}
          style={{
            background: orderType === "limit" ? "var(--arb-yellow)" : "transparent",
            color: orderType === "limit" ? "var(--background)" : "var(--muted-foreground)"
          }}
        >
          <div className="flex flex-col items-center">
            <span>LIMIT ORDER</span>
            <span className="text-[10px] font-normal opacity-70">Set your price</span>
          </div>
        </button>
      </div>
      
      {orderType === "limit" && (
        <div className="mt-3">
          <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
            Target Spread (%)
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={limitPrice || ""}
            onChange={(e) => onLimitPriceChange(parseFloat(e.target.value) || null)}
            placeholder="e.g. 1.5"
            className="w-full h-10 px-3 rounded border"
            style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
          />
          <p className="text-[10px] mt-1" style={{ color: "var(--muted-foreground)" }}>
            Order will execute when spread reaches this percentage
          </p>
        </div>
      )}
    </div>
  );
}

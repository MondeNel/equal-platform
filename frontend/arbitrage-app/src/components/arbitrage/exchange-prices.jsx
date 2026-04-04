import { ArrowUpDown } from "lucide-react";

export function ExchangePrices({ prices, opportunity, isLoading }) {
  const formatPrice = (value) => {
    if (!value) return "---";
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatSpread = (value) => {
    if (!value) return "+R0";
    return `+R${Math.abs(value).toFixed(0)}`;
  };

  const buyExchange = opportunity?.buy_exchange || "LUNO";
  const sellExchange = opportunity?.sell_exchange || "BINANCE";
  const buyPrice = opportunity?.buy_price || 0;
  const sellPrice = opportunity?.sell_price || 0;
  const spreadZar = opportunity?.spread_zar || 0;

  return (
    <div className="space-y-2">
      <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
        Price Across Exchanges
      </p>
      
      <div className="space-y-2">
        {/* Buy Exchange */}
        <div className="rounded-lg p-3" style={{ borderColor: "var(--arb-cyan)", background: "rgba(34,211,238,0.05)" }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--muted-foreground)" }}>
                Buy At
              </p>
              <p className="text-lg font-bold" style={{ color: "var(--arb-cyan)" }}>
                {buyExchange}
              </p>
              <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>South Africa</p>
            </div>
            <div className="text-right">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--arb-cyan)" }} />
              ) : (
                <>
                  <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
                    ${formatPrice(buyPrice)}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--arb-green)" }}>LOWEST</p>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Spread Indicator */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold" style={{ background: "var(--arb-green)", color: "var(--background)" }}>
            <ArrowUpDown className="w-4 h-4" />
            {formatSpread(spreadZar)} SPREAD
          </div>
        </div>
        
        {/* Sell Exchange */}
        <div className="rounded-lg p-3" style={{ borderColor: "var(--arb-magenta)", background: "rgba(232,121,249,0.05)" }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--muted-foreground)" }}>
                Sell At
              </p>
              <p className="text-lg font-bold" style={{ color: "var(--arb-magenta)" }}>
                {sellExchange}
              </p>
              <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>Global</p>
            </div>
            <div className="text-right">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--arb-magenta)" }} />
              ) : (
                <>
                  <p className="text-xl font-bold" style={{ color: "var(--arb-green)" }}>
                    ${formatPrice(sellPrice)}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--arb-red)" }}>HIGHER</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

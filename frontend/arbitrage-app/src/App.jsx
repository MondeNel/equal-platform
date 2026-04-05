import { useState, useEffect, useCallback } from "react";
import {
  fetchOpportunities,
  fetchExchangePrices,
  estimateProfit,
  executeArbitrage,
  createLimitOrder,
} from "./lib/api";
import "./styles/globals.css";

// ── Constants pulled from exchange_service.py ──────────────────────
const ALL_EXCHANGES = ["Luno", "VALR", "AltCoinTrader", "Binance", "Kraken", "Coinbase"];
const SUPPORTED_SYMBOLS = ["BTC/USD", "ETH/USD", "SOL/USD", "XRP/USD"];
const WINDOW_SECONDS = 10; // Matches backend PRICE_CACHE_TTL

function App() {
  // ── Selections ──────────────────────────────────────────────────
  const [symbol, setSymbol] = useState("BTC/USD");
  const [market, setMarket] = useState("crypto");
  const [buyExchange, setBuyExchange] = useState("Luno");
  const [sellExchange, setSellExchange] = useState("Binance");
  const [orderType, setOrderType] = useState("market");
  const [amount, setAmount] = useState(1000);
  const [activeTab, setActiveTab] = useState("ARB");

  // ── Data ────────────────────────────────────────────────────────
  const [exchangePrices, setExchangePrices] = useState({});   // { Luno: { "BTC/USD": { usd, zar } }, ... }
  const [estimate, setEstimate] = useState(null);             // /estimate-profit response
  const [usdToZar, setUsdToZar] = useState(18.0);
  const [balances, setBalances] = useState({ account: 0, current: 0 });

  // ── UI state ────────────────────────────────────────────────────
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [windowSecs, setWindowSecs] = useState(WINDOW_SECONDS);

  // ── Load exchange prices every 10s ──────────────────────────────
  const loadPrices = useCallback(async () => {
    try {
      const data = await fetchExchangePrices();
      setExchangePrices(data);
    } catch (err) {
      console.error("Exchange prices fetch failed:", err.message);
    }
  }, []);

  useEffect(() => {
    loadPrices();
    const interval = setInterval(loadPrices, WINDOW_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [loadPrices]);

  // ── Re-estimate profit whenever inputs change ────────────────────
  const loadEstimate = useCallback(async () => {
    if (!buyExchange || !sellExchange || buyExchange === sellExchange) return;
    try {
      const data = await estimateProfit({
        symbol,
        buy_exchange: buyExchange,
        sell_exchange: sellExchange,
        amount,
      });
      setEstimate(data);
      setError(null);
    } catch (err) {
      setEstimate(null);
      setError(err.message);
    }
  }, [symbol, buyExchange, sellExchange, amount]);

  useEffect(() => {
    loadEstimate();
    const interval = setInterval(loadEstimate, WINDOW_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [loadEstimate]);

  // ── Window countdown — resets every 10s ─────────────────────────
  useEffect(() => {
    setWindowSecs(WINDOW_SECONDS);
    const tick = setInterval(() => {
      setWindowSecs((s) => {
        if (s <= 1) {
          loadPrices();
          loadEstimate();
          return WINDOW_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [loadPrices, loadEstimate]);

  // ── Prevent same exchange on both sides ──────────────────────────
  const handleBuyExchangeChange = (val) => {
    setBuyExchange(val);
    if (val === sellExchange) {
      const next = ALL_EXCHANGES.find((e) => e !== val);
      setSellExchange(next || "");
    }
  };

  const handleSellExchangeChange = (val) => {
    setSellExchange(val);
    if (val === buyExchange) {
      const next = ALL_EXCHANGES.find((e) => e !== val);
      setBuyExchange(next || "");
    }
  };

  // ── Derived values ───────────────────────────────────────────────
  const buyPrice  = exchangePrices[buyExchange]?.[symbol]?.usd  ?? 0;
  const sellPrice = exchangePrices[sellExchange]?.[symbol]?.usd ?? 0;

  // Bar widths: buy is lower → narrower bar (red), sell is higher → full bar (green)
  const maxPrice    = Math.max(buyPrice, sellPrice, 1);
  const buyBarPct   = buyPrice  ? Math.max(55, (buyPrice  / maxPrice) * 100) : 75;
  const sellBarPct  = sellPrice ? Math.max(55, (sellPrice / maxPrice) * 100) : 100;

  const spreadUsd   = estimate?.spread           ?? (sellPrice - buyPrice);
  const spreadPct   = estimate?.spread_pct       ?? 0;
  const spreadZar   = estimate?.spread           ? estimate.spread * usdToZar : spreadUsd * usdToZar;
  const isProfitable = (estimate?.net_profit_zar ?? 0) > 0;

  const coins         = estimate?.coin_quantity       ?? 0;
  const spreadValUsd  = estimate?.gross_profit_zar    ? (estimate.gross_profit_zar / usdToZar).toFixed(0) : "0";
  const spreadValZar  = estimate?.gross_profit_zar    ?? 0;
  const feesZar       = estimate?.total_fees_zar      ?? 0;
  const profitZar     = estimate?.net_profit_zar      ?? 0;

  // Timer visuals
  const timerPct   = ((windowSecs / WINDOW_SECONDS) * 100).toFixed(1);
  const timerColor = windowSecs <= 3 ? "#ff5c5c" : windowSecs <= 6 ? "#e8c84a" : "#3ddc84";
  const timerBg    = timerColor;

  // ── Formatters ────────────────────────────────────────────────────
  const fmtZAR = (v) =>
    new Intl.NumberFormat("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v ?? 0);

  const fmtR = (v) =>
    `R${Math.abs(parseFloat(v ?? 0)).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ── Execute ───────────────────────────────────────────────────────
  const handleExecute = async () => {
    if (!estimate || !isProfitable) return;
    setIsExecuting(true);
    setError(null);
    try {
      if (orderType === "market") {
        await executeArbitrage({
          symbol,
          buy_exchange: buyExchange,
          sell_exchange: sellExchange,
          amount,
          opportunity_id: null,
        });
      } else {
        await createLimitOrder({
          symbol,
          buy_exchange: buyExchange,
          sell_exchange: sellExchange,
          amount,
          target_spread_pct: spreadPct,
          expires_in_minutes: 60,
        });
      }
      await loadEstimate();
      alert("Order executed successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  // ── Nav tabs ──────────────────────────────────────────────────────
  const tabs = [
    {
      id: "SET", icon: (
        <svg viewBox="0 0 24 24" width="14" height="14">
          <polyline className="ni" points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
    {
      id: "TRADE", icon: (
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path className="ni" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      id: "ARB", icon: (
        <svg viewBox="0 0 24 24" width="14" height="14">
          <polygon className="ni" points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
    {
      id: "POOL", icon: (
        <svg viewBox="0 0 24 24" width="14" height="14">
          <circle className="ni" cx="12" cy="12" r="10" />
          <path className="ni" d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      id: "WALLET", icon: (
        <svg viewBox="0 0 24 24" width="14" height="14">
          <rect className="ni" x="2" y="5" width="20" height="14" rx="2" />
          <path className="ni" d="M2 10h20" />
        </svg>
      ),
    },
  ];

  return (
    <div className="aa">

      {/* ── Header ── */}
      <div className="aa-head">
        <div>
          <div className="aa-logo">ARBITRAGE</div>
          <div className="aa-logo-sub">BUY LOW · SELL HIGH · ACROSS EXCHANGES</div>
        </div>
        <button className="wallet-btn" onClick={() => setActiveTab("WALLET")}>
          <svg viewBox="0 0 24 24" width="16" height="16">
            <rect className="wi" x="2" y="5" width="20" height="14" rx="2" />
            <path className="wi" d="M2 10h20" />
            <path className="wi" d="M16 14h.01" />
          </svg>
          <div className="wallet-lbl">WALLET</div>
        </button>
      </div>

      <div className="aa-inner">

        {/* ── Balances ── */}
        <div className="bal-row">
          <div className="bal-card">
            <div className="bal-lbl">ACCOUNT BALANCE</div>
            <div className="bal-val">ZAR {fmtZAR(balances.account)}</div>
          </div>
          <div className="bal-card">
            <div className="bal-lbl">CURRENT BALANCE</div>
            <div className="bal-val gold">ZAR {fmtZAR(balances.current)}</div>
          </div>
        </div>

        {/* ── Market + Symbol ── */}
        <div className="sel-row">
          <div className="sel-grp">
            <div className="sel-lbl">MARKET</div>
            <select className="sel" value={market} onChange={(e) => setMarket(e.target.value)}>
              <option value="crypto">Crypto</option>
              <option value="forex">Forex</option>
              <option value="stocks">Stocks</option>
            </select>
          </div>
          <div className="sel-grp">
            <div className="sel-lbl">SYMBOL</div>
            <select className="sel gold-sel" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              {SUPPORTED_SYMBOLS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Exchange Pair ── */}
        <div className="sel-row">
          <div className="sel-grp">
            <div className="sel-lbl exch-lbl-buy">EXCHANGE 1 · BUY</div>
            <select
              className="sel sel-buy"
              value={buyExchange}
              onChange={(e) => handleBuyExchangeChange(e.target.value)}
            >
              {ALL_EXCHANGES.map((ex) => (
                <option key={ex} value={ex} disabled={ex === sellExchange}>
                  {ex}
                </option>
              ))}
            </select>
          </div>
          <div className="sel-grp">
            <div className="sel-lbl exch-lbl-sell">EXCHANGE 2 · SELL</div>
            <select
              className="sel sel-sell"
              value={sellExchange}
              onChange={(e) => handleSellExchangeChange(e.target.value)}
            >
              {ALL_EXCHANGES.map((ex) => (
                <option key={ex} value={ex} disabled={ex === buyExchange}>
                  {ex}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Live Spread Arena ── */}
        <div className="arena-label">LIVE SPREAD ARENA</div>
        <div className="arena">

          {/* Price bars: buy = red (lower), sell = green (higher) */}
          <div className="pb-wrap">
            <div className="pb-row">
              <div className="pb-name buy-name">{buyExchange}</div>
              <div className="pb-track">
                <div className="pb-fill pb-buy" style={{ width: `${buyBarPct}%` }} />
              </div>
              <div className="pb-val pb-val-buy">
                {buyPrice ? `$${buyPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "—"}
              </div>
            </div>
            <div className="pb-row">
              <div className="pb-name sell-name">{sellExchange}</div>
              <div className="pb-track">
                <div className="pb-fill pb-sell" style={{ width: `${sellBarPct}%` }} />
              </div>
              <div className="pb-val pb-val-sell">
                {sellPrice ? `$${sellPrice.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "—"}
              </div>
            </div>
          </div>

          {/* Spread callout */}
          <div className="spread-box">
            <div>
              <div className="spread-left-lbl">PRICE GAP</div>
              <div className="spread-num">
                {spreadZar > 0 ? fmtR(spreadZar) : "R—"}
              </div>
              <div className="spread-usd">
                ${spreadUsd > 0 ? spreadUsd.toFixed(2) : "0.00"} USD spread
              </div>
            </div>
            <div className="spread-right">
              <div className="spread-pct">
                {spreadPct > 0 ? `+${spreadPct.toFixed(2)}%` : "—"}
              </div>
              <div className={`spread-badge ${isProfitable ? "profitable" : estimate ? "marginal" : "waiting"}`}>
                {!estimate ? "SCANNING..." : isProfitable ? "PROFITABLE" : "MARGINAL"}
              </div>
            </div>
          </div>

          {/* Window countdown */}
          <div className="window-row">
            <div className="win-lbl">WINDOW</div>
            <div className="win-track">
              <div
                className="win-fill"
                style={{
                  width: `${timerPct}%`,
                  background: timerBg,
                  transition: "width 1s linear, background 0.4s",
                }}
              />
            </div>
            <div className="win-timer" style={{ color: timerColor }}>
              0:{String(windowSecs).padStart(2, "0")}
            </div>
          </div>
        </div>

        {/* ── Order Type ── */}
        <span className="sec-lbl">ORDER TYPE</span>
        <div className="ord-tog">
          <button
            className={`ord-btn ${orderType === "market" ? "on" : ""}`}
            onClick={() => setOrderType("market")}
          >
            <div className="ord-t">MARKET ORDER</div>
            <div className="ord-s">Execute now</div>
          </button>
          <button
            className={`ord-btn ${orderType === "limit" ? "on" : ""}`}
            onClick={() => setOrderType("limit")}
          >
            <div className="ord-t">LIMIT ORDER</div>
            <div className="ord-s">Set your price</div>
          </button>
        </div>

        {/* ── Amount ── */}
        <span className="sec-lbl">AMOUNT (ZAR)</span>
        <div className="amt-box">
          <div className="amt-disp">
            <span className="amt-cur">ZAR</span>
            <input
              className="amt-in"
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="preset-row">
            {[500, 1000, 2500, 5000].map((val) => (
              <button
                key={val}
                className={`pre-btn ${amount === val ? "on" : ""}`}
                onClick={() => setAmount(val)}
              >
                {val >= 1000 ? `R${val / 1000}K` : `R${val}`}
              </button>
            ))}
          </div>
        </div>

        {/* ── Transaction Breakdown ── */}
        <span className="sec-lbl">TRANSACTION BREAKDOWN</span>
        <div className="coins-box">
          <div className="c-row">
            <span className="c-lbl">COINS ({symbol.split("/")[0]})</span>
            <span className="c-val">{coins > 0 ? coins.toFixed(6) : "0.000000"}</span>
          </div>
          <div className="c-row">
            <span className="c-lbl">SPREAD VALUE</span>
            <span className="c-val">
              ${spreadValUsd} / {fmtR(spreadValZar)}
            </span>
          </div>
          <div className="c-row">
            <span className="c-lbl">EXCHANGE FEES</span>
            <span className="c-val red">-{fmtR(estimate?.exchange_fees_zar ?? 0)}</span>
          </div>
          <div className="c-row">
            <span className="c-lbl">PLATFORM FEE (10%)</span>
            <span className="c-val red">-{fmtR(estimate?.platform_fee_zar ?? 0)}</span>
          </div>
          <div className="c-div" />
          <div className="c-row">
            <span className="c-lbl">ESTIMATED PROFIT</span>
            <span className={`c-val ${profitZar >= 0 ? "green" : "red"}`}>
              {profitZar >= 0 ? "+" : ""}{fmtR(profitZar)}
            </span>
          </div>
        </div>

        {/* ── Warning ── */}
        <div className="warn-box">
          <div className="warn-icon">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path className="wi-r" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line className="wi-r" x1="12" y1="9" x2="12" y2="13" />
              <line className="wi-r" x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <div className="warn-title">Act Now — Window Closing</div>
            <div className="warn-sub">
              Arbitrage opportunities disappear in seconds. Spread may shift before your order executes.
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && <div className="error-banner">{error}</div>}

        {/* ── Execute ── */}
        <button
          className="exec-btn"
          onClick={handleExecute}
          disabled={!estimate || !isProfitable || isExecuting}
        >
          {isExecuting ? "EXECUTING..." : "⚡ EXECUTE ARBITRAGE"}
        </button>

        {/* ── Bottom Nav ── */}
        <div className="bot-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nb ${activeTab === tab.id ? "on" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="nb-icon">{tab.icon}</div>
              <div className="nb-lbl">{tab.id}</div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

export default App;
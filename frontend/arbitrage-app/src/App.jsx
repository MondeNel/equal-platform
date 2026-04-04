import { useState, useEffect, useCallback } from "react";
import { fetchOpportunities, executeArbitrage, createLimitOrder, fetchWalletBalances } from "./lib/api";
import "./styles/globals.css";

function App() {
  const [symbol, setSymbol] = useState("BTC/USD");
  const [market, setMarket] = useState("crypto");
  const [orderType, setOrderType] = useState("market");
  const [amount, setAmount] = useState(1000);
  const [limitTargetSpread, setLimitTargetSpread] = useState(1.5);
  const [opportunity, setOpportunity] = useState(null);
  const [balances, setBalances] = useState({ account: 2450.00, current: 2612.40 });
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("ARB");
  const [isScanning, setIsScanning] = useState(true);

  const loadOpportunities = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchOpportunities(symbol, 0.1);
      if (data.opportunities && data.opportunities.length > 0) {
        setOpportunity(data.opportunities[0]);
      } else {
        setOpportunity(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    loadOpportunities();
    const interval = setInterval(loadOpportunities, 5000);
    return () => clearInterval(interval);
  }, [loadOpportunities]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatR = (value) => `R${Math.abs(parseFloat(value)).toLocaleString()}`;

  const calculateBreakdown = () => {
    if (!opportunity)
      return { coins: "0.000000", spreadValueUsd: "0", spreadValueZar: "0", setTradeFee: "0", estimatedProfit: "0" };
    const buyPrice = opportunity.buy_price || 0;
    const sellPrice = opportunity.sell_price || 0;
    const usdToZar = 18.5;
    const coins = buyPrice > 0 ? amount / usdToZar / buyPrice : 0;
    const spreadValueUsd = coins * (sellPrice - buyPrice);
    const spreadValueZar = spreadValueUsd * usdToZar;
    const setTradeFee = -amount * 0.015;
    const estimatedProfit = spreadValueZar + setTradeFee;
    return {
      coins: coins.toFixed(6),
      spreadValueUsd: spreadValueUsd.toFixed(0),
      spreadValueZar: spreadValueZar.toFixed(0),
      setTradeFee: setTradeFee.toFixed(0),
      estimatedProfit: estimatedProfit.toFixed(0),
    };
  };

  const breakdown = calculateBreakdown();
  const isProfitable = opportunity && opportunity.spread_pct > 0;

  const handleExecute = async () => {
    if (!opportunity) return;
    setIsExecuting(true);
    setError(null);
    try {
      if (orderType === "market") {
        await executeArbitrage({
          symbol,
          amount_zar: amount,
          buy_exchange: opportunity.buy_exchange,
          sell_exchange: opportunity.sell_exchange,
        });
      } else {
        await createLimitOrder({
          symbol,
          amount_zar: amount,
          target_spread_percent: limitTargetSpread,
          buy_exchange: opportunity.buy_exchange,
          sell_exchange: opportunity.sell_exchange,
        });
      }
      await loadOpportunities();
      alert("Order executed successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const spreadZar = opportunity?.spread_zar
    ? `R${Math.abs(parseFloat(opportunity.spread_zar)).toLocaleString()}`
    : "R1,240";

  const tabs = [
    { id: "SET", icon: "📈" },
    { id: "TRADE", icon: "💱" },
    { id: "ARB", icon: "⚡" },
    { id: "POOLING", icon: "🔄" },
    { id: "WALLET", icon: "👛" },
  ];

  return (
    <div className="app-container">
      {/* ── Header ── */}
      <div className="header">
        <div>
          <div className="header-title">ARBITRAGE</div>
          <div className="header-sub">BUY LOW · SELL HIGH · ACROSS EXCHANGES</div>
        </div>
        <button className={`scan-btn ${isScanning ? "scanning" : ""}`} onClick={() => setIsScanning(!isScanning)}>
          <span className="scan-dot" />
          AI {isScanning ? "SCANNING" : "PAUSED"}
        </button>
      </div>

      {/* ── Balances ── */}
      <div className="balance-row">
        <div className="balance-card">
          <div className="balance-label">ACCOUNT BALANCE</div>
          <div className="balance-value">ZAR {formatCurrency(balances.account)}</div>
        </div>
        <div className="balance-card">
          <div className="balance-label">CURRENT BALANCE</div>
          <div className="balance-value highlight">ZAR {formatCurrency(balances.current)}</div>
        </div>
      </div>

      {/* ── Opportunity Alert ── */}
      {opportunity && isProfitable && (
        <div className="alert-banner">
          <div className="alert-avatar">AI</div>
          <div className="alert-content">
            <div className="alert-tag">PETER · OPPORTUNITY DETECTED</div>
            <div className="alert-msg">
              {opportunity.symbol || symbol} spread of {spreadZar} found between{" "}
              {opportunity.buy_exchange || "Luno"} and {opportunity.sell_exchange || "Binance"}
            </div>
          </div>
          <button className="alert-apply">APPLY ▶</button>
        </div>
      )}

      {/* ── Market & Symbol ── */}
      <div className="selectors-row">
        <div className="selector-group">
          <div className="selector-label">MARKET</div>
          <select className="selector" value={market} onChange={(e) => setMarket(e.target.value)}>
            <option value="crypto">Crypto</option>
            <option value="forex">Forex</option>
            <option value="stocks">Stocks</option>
          </select>
        </div>
        <div className="selector-group">
          <div className="selector-label">SYMBOL</div>
          <select className="selector selector-gold" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            <option value="BTC/USD">BTC/USD</option>
            <option value="ETH/USD">ETH/USD</option>
            <option value="XRP/USD">XRP/USD</option>
            <option value="SOL/USD">SOL/USD</option>
          </select>
        </div>
      </div>

      {/* ── Exchange Cards ── */}
      <div className="section-label">PRICE ACROSS EXCHANGES</div>
      <div className="exchange-row">
        {/* BUY card */}
        <div className="exchange-card exchange-buy">
          <div className="exchange-direction">BUY AT</div>
          <div className="exchange-name cyan">{opportunity?.buy_exchange || "LUNO"}</div>
          <div className="exchange-region">South Africa</div>
          <div className="exchange-price cyan-price">
            ${opportunity?.buy_price?.toLocaleString() || "71,842"}
          </div>
          <div className="exchange-tag cyan-tag">LOWER ▼</div>
        </div>

        {/* Spread badge */}
        <div className="spread-badge">
          +{opportunity?.spread_zar ? `R${Math.round(Math.abs(parseFloat(opportunity.spread_zar)))}` : "R892"} SPREAD
        </div>

        {/* SELL card */}
        <div className="exchange-card exchange-sell">
          <div className="exchange-direction">SELL AT</div>
          <div className="exchange-name magenta">{opportunity?.sell_exchange || "BINANCE"}</div>
          <div className="exchange-region">Global</div>
          <div className="exchange-price magenta-price">
            ${opportunity?.sell_price?.toLocaleString() || "72,734"}
          </div>
          <div className="exchange-tag magenta-tag">HIGHER ▲</div>
        </div>
      </div>

      {/* ── Order Type ── */}
      <div className="section-label">ORDER TYPE</div>
      <div className="order-toggle">
        <button
          className={`order-btn ${orderType === "market" ? "order-active" : ""}`}
          onClick={() => setOrderType("market")}
        >
          <div className="order-btn-title">MARKET ORDER</div>
          <div className="order-btn-sub">Execute now</div>
        </button>
        <button
          className={`order-btn ${orderType === "limit" ? "order-active" : ""}`}
          onClick={() => setOrderType("limit")}
        >
          <div className="order-btn-title">LIMIT ORDER</div>
          <div className="order-btn-sub">Set your price</div>
        </button>
      </div>

      {/* ── Amount ── */}
      <div className="amount-section">
        <div className="amount-header">
          <span className="section-label" style={{ marginBottom: 0 }}>AMOUNT (ZAR)</span>
          <span className="section-label" style={{ marginBottom: 0 }}>TAP TO EDIT</span>
        </div>
        <div className="amount-box">
          <div className="amount-display">
            <span className="amount-currency">ZAR</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="amount-input"
            />
          </div>
          <div className="preset-row">
            {[500, 1000, 2500, 5000].map((val) => (
              <button
                key={val}
                className={`preset-btn ${amount === val ? "preset-active" : ""}`}
                onClick={() => setAmount(val)}
              >
                {val >= 1000 ? `R${val / 1000}K` : `R${val}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Breakdown ── */}
      <div className="section-label">COINS (BTC)</div>
      <div className="breakdown">
        <div className="breakdown-row">
          <span className="breakdown-label">COINS (BTC)</span>
          <span className="breakdown-value">{breakdown.coins}</span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">SPREAD VALUE</span>
          <span className="breakdown-value">
            ${breakdown.spreadValueUsd} / {formatR(breakdown.spreadValueZar)}
          </span>
        </div>
        <div className="breakdown-row">
          <span className="breakdown-label">EST. FEES</span>
          <span className="breakdown-value red">{formatR(breakdown.setTradeFee)}</span>
        </div>
        <div className="breakdown-divider" />
        <div className="breakdown-row">
          <span className="breakdown-label">ESTIMATED PROFIT</span>
          <span className={`breakdown-profit ${parseFloat(breakdown.estimatedProfit) >= 0 ? "green" : "red"}`}>
            {parseFloat(breakdown.estimatedProfit) >= 0 ? "+" : ""}
            {formatR(breakdown.estimatedProfit)}
          </span>
        </div>
      </div>

      {/* ── Warning ── */}
      <div className="warning-text">
        ⚠ Arbitrage windows close fast. Spread may change by the time your order executes.
      </div>

      {/* ── Error ── */}
      {error && <div className="error-banner">{error}</div>}

      {/* ── Execute Button ── */}
      <button className="execute-btn" onClick={handleExecute} disabled={!opportunity || isExecuting}>
        {isExecuting ? "⚡ EXECUTING..." : "⚡ EXECUTE ARBITRAGE"}
      </button>

      {/* ── Bottom Nav ── */}
      <div className="bottom-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-btn ${activeTab === tab.id ? "nav-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.id}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
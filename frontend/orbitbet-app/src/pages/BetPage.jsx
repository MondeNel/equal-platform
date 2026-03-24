import { useState, useEffect } from 'react';
import { betAPI } from '../api';

export default function BetPage() {
  const [markets, setMarkets] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState('Crypto');
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USD');
  const [currentPrice, setCurrentPrice] = useState(110.00);
  const [priceHistory, setPriceHistory] = useState([110, 110, 110]);
  const [stake, setStake] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load markets on mount
  useEffect(() => {
    async function fetchMarkets() {
      try {
        const res = await betAPI.get('/markets');
        setMarkets(res.data.markets);
      } catch (err) {
        setError('Failed to load markets');
      }
    }
    fetchMarkets();
  }, []);

  // Simulate price movement
  useEffect(() => {
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 4;
      setCurrentPrice(prev => Math.max(50, Math.min(200, prev + change)));
      setPriceHistory(prev => [...prev.slice(1), currentPrice + change]);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentPrice]);

  const currentMarketSymbols = markets?.find(m => m.id === selectedMarket)?.symbols || [];

  // Update symbol when market changes
  useEffect(() => {
    if (currentMarketSymbols.length > 0 && !currentMarketSymbols.includes(selectedSymbol)) {
      setSelectedSymbol(currentMarketSymbols[0]);
    }
  }, [currentMarketSymbols, selectedSymbol]);

  async function handleBet(direction) {
    if (!localStorage.getItem('equal_token')) {
      window.location.href = 'http://localhost:5171';
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await betAPI.post('/place', {
        symbol: selectedSymbol,
        stake: parseFloat(stake),
        direction: direction,
      });
      setSuccess(`Bet placed! ${direction} on ${selectedSymbol}`);
      setStake(100);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to place bet';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // Calculate gauge angle based on price position (0-180 degrees)
  const minPrice = 50;
  const maxPrice = 200;
  const pricePercent = (currentPrice - minPrice) / (maxPrice - minPrice);
  const gaugeAngle = pricePercent * 180 - 90; // -90 to 90

  const marketOptions = markets?.map(m => m.id) || [];

  return (
    <div style={{ minHeight: "100vh", background: "#05050e", display: "flex", flexDirection: "column", padding: "16px", paddingBottom: "120px" }}>
      
      {/* Header with prices */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", fontSize: "12px", color: "#5050a0" }}>
        <span>ZAR <span style={{ fontSize: "14px", color: "#c8c8ee", fontWeight: "bold" }}>110.00</span></span>
        <span>ZAR <span style={{ fontSize: "14px", color: "#c8c8ee", fontWeight: "bold" }}>68.00</span></span>
      </div>

      {/* Market and Symbol Selection */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
        <select
          value={selectedMarket}
          onChange={(e) => {
            setSelectedMarket(e.target.value);
            const symbols = markets?.find(m => m.id === e.target.value)?.symbols || [];
            setSelectedSymbol(symbols[0]);
          }}
          style={{
            background: "#0d0820",
            border: "1px solid #2e2e58",
            borderRadius: "8px",
            padding: "10px",
            color: "#c8c8ee",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          {marketOptions.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          style={{
            background: "#0d0820",
            border: "1px solid #2e2e58",
            borderRadius: "8px",
            padding: "10px",
            color: "#c8c8ee",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          {currentMarketSymbols.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Price Display */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "11px", color: "#5050a0", letterSpacing: "1px", marginBottom: "4px" }}>
          {selectedSymbol}
        </div>
        <div style={{ fontSize: "28px", fontWeight: "bold", color: "#facc15" }}>
          {currentPrice.toFixed(2)}
        </div>
      </div>

      {/* Circular Gauge */}
      <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
        <svg width="160" height="100" viewBox="0 0 160 100" style={{ position: "relative" }}>
          {/* Gauge arc background */}
          <circle cx="80" cy="90" r="50" fill="none" stroke="#1e1e3a" strokeWidth="2" />
          
          {/* Gauge arc filled */}
          <circle
            cx="80"
            cy="90"
            r="50"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray={`${(pricePercent * 155.0)} 155.0`}
            style={{ transform: "rotate(-90deg)", transformOrigin: "80px 90px" }}
          />
          
          {/* Needle */}
          <g style={{ transform: `rotate(${gaugeAngle}deg)`, transformOrigin: "80px 90px", transition: "transform 0.3s ease" }}>
            <line x1="80" y1="90" x2="80" y2="45" stroke="#facc15" strokeWidth="2" />
            <circle cx="80" cy="90" r="3" fill="#facc15" />
          </g>
          
          {/* Min/Max labels */}
          <text x="35" y="95" fontSize="10" fill="#5050a0">50</text>
          <text x="125" y="95" fontSize="10" fill="#5050a0">200</text>
        </svg>
      </div>

      {/* Price ticker display */}
      <div style={{ background: "#0d0820", border: "1px solid #2e2e58", borderRadius: "8px", padding: "8px", marginBottom: "20px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", fontSize: "16px", fontWeight: "bold", color: "#facc15", letterSpacing: "2px" }}>
          {priceHistory.map((p, i) => (
            <span key={i}>{Math.floor(p)}</span>
          ))}
        </div>
        <div style={{ fontSize: "9px", color: "#5050a0", marginTop: "4px" }}>
          R 4.5 • 0.09% • 1.1%
        </div>
      </div>

      {/* Stake Input */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ fontSize: "11px", color: "#5050a0", letterSpacing: "1px", display: "block", marginBottom: "6px" }}>
          STAKE AMOUNT
        </label>
        <input
          type="number"
          value={stake}
          onChange={(e) => setStake(e.target.value)}
          style={{
            width: "100%",
            background: "#0d0820",
            border: "1px solid #2e2e58",
            borderRadius: "8px",
            padding: "10px",
            color: "#c8c8ee",
            fontSize: "14px",
          }}
        />
      </div>

      {/* Error/Success Messages */}
      {error && <div style={{ background: "#7f1d1d", border: "1px solid #991b1b", borderRadius: "6px", padding: "10px", marginBottom: "12px", fontSize: "12px", color: "#fecaca" }}>{error}</div>}
      {success && <div style={{ background: "#064e3b", border: "1px solid #047857", borderRadius: "6px", padding: "10px", marginBottom: "12px", fontSize: "12px", color: "#86efac" }}>{success}</div>}

      {/* Up/Down Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <button
          onClick={() => handleBet("UP")}
          disabled={loading}
          style={{
            background: "#047857",
            border: "1px solid #10b981",
            borderRadius: "8px",
            padding: "14px",
            color: "#10b981",
            fontWeight: "bold",
            fontSize: "14px",
            letterSpacing: "1px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => !loading && (e.target.style.background = "#059669")}
          onMouseLeave={(e) => !loading && (e.target.style.background = "#047857")}
        >
          ▲ UP
        </button>
        <button
          onClick={() => handleBet("DOWN")}
          disabled={loading}
          style={{
            background: "#7f1d1d",
            border: "1px solid #f87171",
            borderRadius: "8px",
            padding: "14px",
            color: "#f87171",
            fontWeight: "bold",
            fontSize: "14px",
            letterSpacing: "1px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => !loading && (e.target.style.background = "#991b1b")}
          onMouseLeave={(e) => !loading && (e.target.style.background = "#7f1d1d")}
        
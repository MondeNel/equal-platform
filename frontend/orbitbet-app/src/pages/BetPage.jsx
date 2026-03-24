import { useState, useEffect } from "react";
import { betAPI } from "../api";

/**
 * BetPage component allows authenticated users to view markets, place bets,
 * and watch a live price orbit simulation.
 */
export default function BetPage() {
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState("Crypto");
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USD");
  const [currentPrice, setCurrentPrice] = useState(110.0);
  const [priceHistory, setPriceHistory] = useState([110, 110, 110, 110, 110, 110]);
  const [stake, setStake] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --- TOKEN FROM URL (for micro-frontend navigation) ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("equal_token", token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // --- AUTH CHECK ---
  useEffect(() => {
    const token = localStorage.getItem("equal_token");
    if (!token) {
      window.location.href = "http://localhost:5171/login";
    }
  }, []);

  // --- LOAD MARKETS ---
  useEffect(() => {
    async function fetchMarkets() {
      try {
        const res = await betAPI.get("/markets");
        setMarkets(res.data.markets || []);
      } catch {
        setError("Failed to load markets");
      }
    }
    fetchMarkets();
  }, []);

  // --- SIMULATE PRICE MOVEMENT ---
  useEffect(() => {
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 4;
      setCurrentPrice((prev) => {
        const newPrice = Math.max(50, Math.min(200, prev + change));
        setPriceHistory((prevHistory) => [...prevHistory.slice(1), newPrice]);
        return newPrice;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentMarketSymbols =
    markets.find((m) => m.id === selectedMarket)?.symbols || [];

  // --- KEEP SYMBOL IN SYNC WITH MARKET ---
  useEffect(() => {
    if (
      currentMarketSymbols.length > 0 &&
      !currentMarketSymbols.includes(selectedSymbol)
    ) {
      setSelectedSymbol(currentMarketSymbols[0]);
    }
  }, [currentMarketSymbols]);

  // --- HANDLE BET ---
  async function handleBet(direction) {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await betAPI.post("/place", {
        symbol: selectedSymbol,
        stake: parseFloat(stake),
        direction: direction,
      });

      setSuccess(`Bet placed! ${direction} on ${selectedSymbol}`);
      setStake(50);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to place bet";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const minPrice = 50;
  const maxPrice = 200;
  const pricePercent = (currentPrice - minPrice) / (maxPrice - minPrice);

  return (
    <div className="min-h-screen bg-[#05050e] px-4 pb-32 flex flex-col items-center text-[#c8c8ee]">
      {/* Header */}
      <div className="w-full flex justify-between text-xs text-[#5050a0] mb-4">
        <span>
          ZAR <span className="text-[#0de74a] font-bold">110.00</span>
        </span>
        <span>
          ZAR <span className="text-[#0de74a] font-bold">60.00</span>
        </span>
      </div>

      {/* Market & Symbol */}
      <div className="w-full grid grid-cols-2 gap-2 mb-4">
        <select
          value={selectedMarket}
          onChange={(e) => {
            const market = e.target.value;
            setSelectedMarket(market);

            const symbols =
              markets.find((m) => m.id === market)?.symbols || [];
            if (symbols.length > 0) {
              setSelectedSymbol(symbols[0]);
            }
          }}
          className="bg-[#0d0820] border border-[#2e2e58] rounded-lg p-2 text-sm text-[#c8c8ee] cursor-pointer"
        >
          {markets.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id}
            </option>
          ))}
        </select>

        <select
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          className="bg-[#0d0820] border border-[#2e2e58] rounded-lg p-2 text-sm text-[#c8c8ee] cursor-pointer"
        >
          {currentMarketSymbols.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Price Display */}
      <div className="text-center mb-6">
        <div className="text-[11px] text-[#5050a0] tracking-widest mb-1">
          {selectedSymbol} • LIVE PRICE
        </div>
        <div className="text-3xl font-bold text-yellow-400 flex justify-center gap-1">
          {currentPrice
            .toFixed(2)
            .split("")
            .map((digit, idx) => (
              <span
                key={idx}
                className="px-1 border border-[#3b3b5c] rounded"
              >
                {digit}
              </span>
            ))}
        </div>
        <div className="text-xs text-green-400 mt-1">▲ 0.0038 LIVE</div>
      </div>

      {/* Probability Orbit */}
      <div className="relative w-40 h-40 mb-6">
        <div className="absolute inset-0 rounded-full border border-[#2e2e58] flex items-center justify-center">
          <div className="w-6 h-6 bg-[#0d0820] rounded-full animate-bounce"></div>
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-2 text-xs text-[#5050a0]">
          <span>r1</span>
          <span>r2</span>
          <span>r3</span>
        </div>
      </div>

      {/* Stake */}
      <div className="w-full mb-4">
        <label className="block text-[11px] text-[#5050a0] mb-1">
          STAKE AMOUNT
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStake((s) => Math.max(1, Number(s) - 1))}
            className="bg-[#0d0820] border border-[#2e2e58] rounded-lg w-10 h-10 text-[#c8c8ee]"
          >
            -
          </button>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            className="bg-[#0d0820] border border-[#2e2e58] rounded-lg p-2 w-full text-center text-[#c8c8ee]"
          />
          <button
            onClick={() => setStake((s) => Number(s) + 1)}
            className="bg-[#0d0820] border border-[#2e2e58] rounded-lg w-10 h-10 text-[#c8c8ee]"
          >
            +
          </button>
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 rounded-md p-2 mb-2 text-xs w-full text-center">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900 border border-green-700 text-green-300 rounded-md p-2 mb-2 text-xs w-full text-center">
          {success}
        </div>
      )}

      {/* Up / Down Buttons */}
      <div className="w-full grid grid-cols-2 gap-2">
        <button
          onClick={() => handleBet("UP")}
          disabled={loading}
          className="bg-green-700 border border-green-500 text-green-200 font-bold py-3 rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          ▲ UP
        </button>
        <button
          onClick={() => handleBet("DOWN")}
          disabled={loading}
          className="bg-red-700 border border-red-500 text-red-300 font-bold py-3 rounded-lg hover:bg-red-600 disabled:opacity-50"
        >
          ▼ DOWN
        </button>
      </div>
    </div>
  );
}
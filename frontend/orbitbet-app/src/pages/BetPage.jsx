import { useState, useEffect } from "react";
import { betAPI } from "../api";

/**
 * BetPage - Mobile-first responsive version
 */
export default function BetPage() {
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState("Crypto");
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USD");
  const [currentPrice, setCurrentPrice] = useState(674321);
  const [priceHistory, setPriceHistory] = useState([6, 7, 4, 3, 2, 1]);
  const [stake, setStake] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("equal_token", token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("equal_token");
    if (!token) window.location.href = "http://localhost:5171/login";
  }, []);

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

  useEffect(() => {
    const interval = setInterval(() => {
      const change = Math.floor((Math.random() - 0.5) * 10);
      setCurrentPrice((prev) => {
        const newPrice = Math.max(100000, prev + change);
        setPriceHistory(newPrice.toString().slice(-6).split("").map(Number));
        return newPrice;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const currentMarketSymbols =
    markets.find((m) => m.id === selectedMarket)?.symbols || [];

  useEffect(() => {
    if (
      currentMarketSymbols.length > 0 &&
      !currentMarketSymbols.includes(selectedSymbol)
    ) {
      setSelectedSymbol(currentMarketSymbols[0]);
    }
  }, [currentMarketSymbols]);

  async function handleBet(direction) {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await betAPI.post("/place", {
        symbol: selectedSymbol,
        stake: Number(stake),
        direction,
      });
      setSuccess(`Bet placed! ${direction}`);
      setStake(50);
      setTimeout(() => setSuccess(""), 2500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to place bet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05050e] px-4 pb-32 flex flex-col items-center text-[#c8c8ee] md:px-8 lg:px-16">

      {/* HEADER */}
      <div className="w-full flex justify-between text-xs text-[#5050a0] mb-3 md:text-sm lg:text-base">
        <span>ZAR <span className="text-[#0de74a] font-bold">110.00</span></span>
        <span>ZAR <span className="text-[#0de74a] font-bold">60.00</span></span>
      </div>

      {/* SELECTORS */}
      <div className="w-full grid grid-cols-2 gap-2 mb-4 md:gap-4">
        <select
          value={selectedMarket}
          onChange={(e) => {
            const market = e.target.value;
            setSelectedMarket(market);
            const symbols =
              markets.find((m) => m.id === market)?.symbols || [];
            if (symbols.length > 0) setSelectedSymbol(symbols[0]);
          }}
          className="bg-[#0d0820] border border-[#2e2e58] rounded-lg p-2 text-sm md:text-base"
        >
          {markets.map((m) => (
            <option key={m.id} value={m.id}>{m.id}</option>
          ))}
        </select>

        <select
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          className="bg-[#0d0820] border border-[#2e2e58] rounded-lg p-2 text-sm md:text-base"
        >
          {currentMarketSymbols.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* DIGIT DISPLAY */}
      <div className="w-full border border-[#f59e0b] rounded-xl p-4 mb-4 text-center md:p-6">
        <div className="text-[10px] text-[#5050a0] mb-2 tracking-widest md:text-xs">
          {selectedSymbol} • LIVE PRICE
        </div>
        <div className="flex justify-center gap-2 md:gap-3">
          {priceHistory.map((digit, idx) => (
            <div
              key={idx}
              className="w-10 h-12 flex items-center justify-center border border-[#f59e0b] rounded text-xl font-bold text-yellow-400 md:w-12 md:h-14 md:text-2xl"
            >
              {digit}
            </div>
          ))}
        </div>
        <div className="text-xs text-green-400 mt-2 md:text-sm">
          ▲ 0.0038 ● LIVE
        </div>
      </div>

      {/* ORBIT */}
      <div className="relative w-52 h-52 mb-6 md:w-64 md:h-64 lg:w-80 lg:h-80">
        <div className="absolute inset-0 rounded-full border border-dashed border-[#2e2e58]" />
        <div className="absolute inset-6 rounded-full border border-dashed border-[#2e2e58]" />
        <div className="absolute inset-12 rounded-full border border-dashed border-[#2e2e58]" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-[#00d4ff] shadow-lg shadow-cyan-500/50 md:w-8 md:h-8"></div>
        </div>

        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full animate-pulse md:w-4 md:h-4"></div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full animate-pulse md:w-4 md:h-4"></div>
      </div>

      {/* STAKE */}
      <div className="w-full mb-4 bg-[#0d0820] border border-[#2e2e58] rounded-xl p-4 md:p-6">
        <label className="text-[10px] text-[#5050a0] md:text-xs">STAKE</label>
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => setStake((s) => Math.max(1, Number(s) - 1))}
            className="w-10 h-10 border border-[#2e2e58] rounded-lg md:w-12 md:h-12"
          >
            -
          </button>
          <span className="text-lg font-bold md:text-xl">R {stake}</span>
          <button
            onClick={() => setStake((s) => Number(s) + 1)}
            className="w-10 h-10 border border-[#2e2e58] rounded-lg md:w-12 md:h-12"
          >
            +
          </button>
        </div>
      </div>

      {/* FEEDBACK */}
      {error && <div className="text-red-400 text-xs mb-2 md:text-sm">{error}</div>}
      {success && <div className="text-green-400 text-xs mb-2 md:text-sm">{success}</div>}

      {/* ACTION BUTTONS */}
      <div className="w-full grid grid-cols-2 gap-3 md:gap-4">
        <button
          onClick={() => handleBet("UP")}
          disabled={loading}
          className="border border-green-500 text-green-400 py-3 rounded-xl font-bold md:py-4 md:text-lg"
        >
          ▲ UP
        </button>

        <button
          onClick={() => handleBet("DOWN")}
          disabled={loading}
          className="border border-red-500 text-red-400 py-3 rounded-xl font-bold md:py-4 md:text-lg"
        >
          ▼ DOWN
        </button>
      </div>
    </div>
  );
}
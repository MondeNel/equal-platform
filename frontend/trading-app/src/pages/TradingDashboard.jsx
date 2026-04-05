import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SYMBOLS, LOT_SIZES, USD_TO_ZAR } from '../constants';
import { walletAPI, pricesAPI, ordersAPI, tradesAPI } from '../services/api';
import CandleChart from '../components/CandleChart';
import WalletModal from '../components/WalletModal';
import BottomNav from '../../../shell/src/components/BottomNav';
import StreakFireBlocks from '../components/StreakFireBlocks';
import StreakMultipliers from '../components/StreakMultipliers';
import { usePlayerStats } from '../hooks/usePlayerStats';

// ─── Drawing Tools Sidebar ────────────────────────────────────────────────────
const DRAW_TOOLS = [
  {
    id: 'cursor',
    label: 'Cursor',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 2l10 5.5-5.5 1L5 14z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'trendline',
    label: 'Trend Line',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <line x1="2" y1="14" x2="14" y2="2" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="2" cy="14" r="1.5" fill="currentColor"/>
        <circle cx="14" cy="2" r="1.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: 'hline',
    label: 'Horizontal Line',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="1" y1="5" x2="1" y2="11" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="15" y1="5" x2="15" y2="11" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    id: 'vline',
    label: 'Vertical Line',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="5" y1="1" x2="11" y2="1" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="5" y1="15" x2="11" y2="15" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    id: 'rect',
    label: 'Rectangle',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <rect x="2" y="3" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      </svg>
    ),
  },
  {
    id: 'fib',
    label: 'Fibonacci',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <text x="1" y="12" fontSize="8" fill="currentColor" fontFamily="monospace">Fib</text>
      </svg>
    ),
  },
  {
    id: 'text',
    label: 'Text',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <text x="4" y="13" fontSize="12" fill="currentColor" fontFamily="monospace">T</text>
      </svg>
    ),
  },
  { id: 'divider', label: '', svg: null },
  {
    id: 'zoom',
    label: 'Magnify',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
        <line x1="10.5" y1="10.5" x2="15" y2="15" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    id: 'arc',
    label: 'Arc',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M2 13 Q8 2 14 13" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      </svg>
    ),
  },
  {
    id: 'ruler',
    label: 'Ruler',
    svg: (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <line x1="8" y1="2" x2="8" y2="14" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="4" y1="5" x2="12" y2="5" stroke="currentColor" strokeWidth="0.8"/>
        <line x1="4" y1="8" x2="12" y2="8" stroke="currentColor" strokeWidth="0.8"/>
        <line x1="4" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="0.8"/>
      </svg>
    ),
  },
];

function DrawingToolbar({ activeTool, onToolSelect }) {
  return (
    <div className="flex flex-col items-center py-2 gap-0.5 bg-[#f0f2f5] border-r border-[#e0e4e8] w-8 shrink-0">
      {DRAW_TOOLS.map((tool, i) => {
        if (tool.id === 'divider') {
          return <div key={`div-${i}`} className="w-4 h-px bg-[#e0e4e8] my-0.5" />;
        }
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            title={tool.label}
            onClick={() => onToolSelect(tool.id)}
            className={`
              w-6 h-6 flex items-center justify-center rounded transition-all duration-150
              ${isActive
                ? 'bg-[#007bff20] text-[#007bff] border border-[#007bff50]'
                : 'text-[#6c757d] hover:text-[#495057] hover:bg-[#e9ecef] border border-transparent'}
            `}
          >
            {tool.svg}
          </button>
        );
      })}
    </div>
  );
}

const CONTROL_PANEL_HEIGHT = 320;

export default function TradingDashboard() {
  const [market, setMarket] = useState('Forex');
  const [symbol, setSymbol] = useState('USD/ZAR');
  const [marketOpen, setMarketOpen] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [lotSize, setLotSize] = useState(null);
  const [volume, setVolume] = useState(1);
  const [entry, setEntry] = useState(null);
  const [takeProfit, setTakeProfit] = useState(null);
  const [stopLoss, setStopLoss] = useState(null);
  const [livePrice, setLivePrice] = useState(0);
  const [chartPrice, setChartPrice] = useState(0);
  const [openPrice, setOpenPrice] = useState(null);
  const [toast, setToast] = useState(null);
  const [showWallet, setShowWallet] = useState(false);
  const [balance, setBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [openTrades, setOpenTrades] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationDetails, setActivationDetails] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultDetails, setResultDetails] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const [timeframe, setTimeframe] = useState('1H');
  const [activeTool, setActiveTool] = useState('cursor');

  const controlPanelRef = useRef(null);

  const displayPrice = chartPrice > 0 ? chartPrice : livePrice;

  const activatingOrdersRef = useRef(new Set());
  const closingTradesRef = useRef(new Set());
  const livePriceRef = useRef(0);
  const apiPriceRef = useRef(0);
  const isPlacingRef = useRef(false);

  const fetchWalletRef = useRef(null);
  const fetchPendingRef = useRef(null);
  const fetchTradesRef = useRef(null);

  const userJson = localStorage.getItem('equal_user');
  const user = userJson ? JSON.parse(userJson) : null;
  const userId = user?.id;

  const { stats: playerStats } = usePlayerStats(userId);
  const currentStreak = playerStats?.win_streak || 0;

  useEffect(() => { livePriceRef.current = displayPrice; }, [displayPrice]);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await walletAPI.get();
      setBalance(res.data.balance);
      setAvailableBalance(res.data.available);
    } catch (e) { console.error('fetchWallet:', e); }
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const res = await ordersAPI.pending();
      setPendingOrders(res.data);
    } catch (e) { console.error('fetchPending:', e); }
  }, []);

  const fetchTrades = useCallback(async () => {
    try {
      const res = await tradesAPI.open();
      setOpenTrades(res.data);
    } catch (e) { console.error('fetchTrades:', e); }
  }, []);

  useEffect(() => { fetchWalletRef.current = fetchWallet; }, [fetchWallet]);
  useEffect(() => { fetchPendingRef.current = fetchPending; }, [fetchPending]);
  useEffect(() => { fetchTradesRef.current = fetchTrades; }, [fetchTrades]);

  useEffect(() => {
    fetchWallet(); fetchPending(); fetchTrades();
    const id = setInterval(() => {
      fetchWallet(); fetchPending(); fetchTrades();
    }, 5000);
    return () => clearInterval(id);
  }, [fetchWallet, fetchPending, fetchTrades]);

  useEffect(() => { setOpenPrice(null); }, [symbol]);

  useEffect(() => {
    let cancelled = false;
    const fetchPrice = async () => {
      try {
        const res = await pricesAPI.get(symbol);
        const p = res.data?.price;
        if (p && p > 0 && !cancelled) {
          setLivePrice(p);
          apiPriceRef.current = p;
          setOpenPrice(prev => prev ?? p);
        }
      } catch (e) { console.error('fetchPrice:', e); }
    };
    fetchPrice();
    const id = setInterval(fetchPrice, 2000);
    return () => { cancelled = true; clearInterval(id); };
  }, [symbol]);

  useEffect(() => {
    const id = setInterval(() => {
      const cur = apiPriceRef.current;
      if (!cur) return;

      setPendingOrders(prev => {
        const stillPending = [];
        for (const o of prev) {
          const entryHit =
            (o.direction === 'BUY' && cur >= o.entry_price) ||
            (o.direction === 'SELL' && cur <= o.entry_price);
          if (entryHit && !activatingOrdersRef.current.has(o.id)) {
            activatingOrdersRef.current.add(o.id);
            setActivationDetails({
              id: o.id, symbol: o.symbol, direction: o.direction,
              entryPrice: o.entry_price, tp: o.take_profit, sl: o.stop_loss,
              lot: o.lot_size, volume: o.volume,
            });
            setShowActivationModal(true);
            setTimeout(() => setShowActivationModal(false), 4000);
            ordersAPI.activate(o.id, cur)
              .then(() => { fetchTradesRef.current?.(); fetchWalletRef.current?.(); })
              .catch(() => {})
              .finally(() => { activatingOrdersRef.current.delete(o.id); fetchPendingRef.current?.(); });
          } else {
            stillPending.push(o);
          }
        }
        return stillPending;
      });

      setOpenTrades(prev => {
        const remaining = [];
        for (const t of prev) {
          const pip = cur < 10 ? 0.0001 : cur < 200 ? 0.0001 : 1;
          const diff = t.direction === 'BUY' ? cur - t.entry_price : t.entry_price - cur;
          const pips = Math.round(diff / pip);
          const pipVal = LOT_SIZES.find(l => l.label === t.lot_size)?.pipValue ?? 1;
          const pnl = (diff / pip) * pipVal * t.volume * (t.symbol.includes('ZAR') ? 1 : USD_TO_ZAR);
          const updated = { ...t, pnl, pips };

          const tpHit = t.take_profit != null && ((t.direction === 'BUY' && cur >= t.take_profit) || (t.direction === 'SELL' && cur <= t.take_profit));
          const slHit = t.stop_loss != null && ((t.direction === 'BUY' && cur <= t.stop_loss) || (t.direction === 'SELL' && cur >= t.stop_loss));

          if (tpHit || slHit) {
            if (closingTradesRef.current.has(t.id)) continue;
            closingTradesRef.current.add(t.id);
            const realPnl = tpHit ? Math.abs(pnl) : -Math.abs(pnl);
            const hitPrice = tpHit ? t.take_profit : t.stop_loss;
            const reason = tpHit ? 'TP' : 'SL';
            const pip2 = Math.abs(Math.round((hitPrice - t.entry_price) / pip));
            tradesAPI.close(t.id, hitPrice, reason)
              .then(() => { fetchTradesRef.current?.(); fetchWalletRef.current?.(); })
              .catch(() => {})
              .finally(() => { closingTradesRef.current.delete(t.id); });
            setResultDetails({
              hit: reason, pnl: realPnl, symbol: t.symbol, direction: t.direction,
              pips: pip2, entryPrice: t.entry_price, closePrice: hitPrice,
            });
            setShowResultModal(true);
            setTimeout(() => setShowResultModal(false), 5000);
          } else {
            remaining.push(updated);
          }
        }
        return remaining;
      });
    }, 400);
    return () => clearInterval(id);
  }, []);

  const totalPnl = openTrades.reduce((s, t) => s + (isNaN(t.pnl) ? 0 : t.pnl), 0);
  const currentBalance = (isNaN(balance) ? 0 : balance) + totalPnl;

  const balFmt = v => {
    const n = Number(v);
    if (isNaN(n)) return '0.00';
    return n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const priceFmt = v => {
    if (v == null) return '–';
    return displayPrice > 10000
      ? v.toLocaleString('en-ZA', { minimumFractionDigits: 2 })
      : displayPrice > 100 ? v.toFixed(2) : v.toFixed(4);
  };

  const priceChange = openPrice && openPrice > 0
    ? (((displayPrice - openPrice) / openPrice) * 100).toFixed(2)
    : '0.00';

  const calcPips = (a, b) => {
    if (a == null || b == null) return null;
    const diff = Math.abs(a - b);
    if (!diff) return null;
    const pip = displayPrice < 10 ? 0.0001 : displayPrice < 200 ? 0.0001 : 1;
    const pips = diff / pip;
    const activeLot = lotSize ?? LOT_SIZES.find(l => l.label === 'Mini');
    const zar = pips * (activeLot?.pipValue ?? 1) * volume * (symbol.includes('ZAR') ? 1 : USD_TO_ZAR);
    return { pips: Math.round(pips), zar };
  };

  const profitCalc = calcPips(entry, takeProfit);
  const lossCalc   = calcPips(entry, stopLoss);

  const tradeDirection = entry != null && takeProfit != null ? (takeProfit > entry ? 'BUY' : 'SELL') : null;
  const canBuy  = tradeDirection === null || tradeDirection === 'BUY';
  const canSell = tradeDirection === null || tradeDirection === 'SELL';

  const resetOrder = () => {
    setEntry(null); setTakeProfit(null); setStopLoss(null);
    setLotSize(null); setVolume(1);
  };

  const handleCloseTrade = async (idOrAll) => {
    try {
      if (idOrAll === 'all') {
        for (const o of pendingOrders) await ordersAPI.cancel(o.id).catch(() => {});
        setPendingOrders([]);
        await tradesAPI.closeAll(livePriceRef.current);
        resetOrder();
      } else {
        const isPending = pendingOrders.some(o => o.id === idOrAll);
        if (isPending) {
          await ordersAPI.cancel(idOrAll);
          setPendingOrders(prev => prev.filter(o => o.id !== idOrAll));
          resetOrder();
        } else {
          await tradesAPI.close(idOrAll, livePriceRef.current, 'MANUAL');
          resetOrder();
        }
      }
      await fetchTrades(); await fetchWallet(); await fetchPending();
    } catch (e) {
      console.error('handleCloseTrade:', e);
      await fetchTrades(); await fetchWallet(); await fetchPending();
    }
  };

  const handleTrade = async type => {
    if (isPlacingRef.current) return;
    if (type === 'BUY' && !canBuy) return;
    if (type === 'SELL' && !canSell) return;
    if (availableBalance <= 0) {
      setToast({ type: 'NOFUNDS', id: Date.now() });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const lot = lotSize?.label ?? 'Mini';
    const vol = volume;
    const cur = livePriceRef.current;
    const dec = cur > 10000 ? 2 : cur > 100 ? 2 : 4;
    const defaultEntry = type === 'BUY'
      ? parseFloat((cur * 1.002).toFixed(dec))
      : parseFloat((cur * 0.998).toFixed(dec));
    const entryP = entry ?? defaultEntry;
    try {
      isPlacingRef.current = true;
      const res = await ordersAPI.place({
        symbol, direction: type, lot_size: lot, volume: vol,
        entry_price: entryP,
        take_profit: takeProfit ?? undefined,
        stop_loss:   stopLoss   ?? undefined,
      });
      fetchWallet(); fetchPending();
      setToast({ type: 'PENDING', id: res.data.id, symbol, tradeType: type, entryStr: priceFmt(entryP), lot, vol });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error('handleTrade:', err.response?.data?.detail || err);
      setToast({ type: 'NOFUNDS', id: Date.now() });
      setTimeout(() => setToast(null), 3000);
    } finally {
      isPlacingRef.current = false;
    }
  };

  const handleLineBtn = key => {
    const dec = displayPrice > 100 ? 2 : 4;
    const snap = v => parseFloat(v.toFixed(dec));
    if (key === 'entry') setEntry(e => e != null ? null : snap(displayPrice));
    if (key === 'tp')    setTakeProfit(t => t != null ? null : snap(displayPrice * 1.003));
    if (key === 'sl')    setStopLoss(s => s != null ? null : snap(displayPrice * 0.997));
  };

  const changeMarket = m => {
    setMarket(m); setSymbol(SYMBOLS[m][0]);
    setMarketOpen(false); setSymbolOpen(false); resetOrder();
  };

  const changeSymbol = s => {
    setSymbol(s); setSymbolOpen(false); resetOrder();
  };

  const isCurrentTradeActive = openTrades.some(
    t => t.symbol === symbol && t.entry_price === entry && t.status === 'active'
  );

  const timeframes = ['1m', '5m', '15m', '1H', '1D', '1W'];

  return (
    <div className="min-h-screen bg-[#f5f7fa] font-mono relative pb-16 overflow-hidden">
      {/* Subtle scan-line overlay removed for cleaner look */}
      
      <div className="relative z-10 max-w-[480px] mx-auto min-h-screen bg-white border-x border-[#e0e4e8] flex flex-col">

        {/* ── Top Bar ── */}
        <div className="flex justify-between items-start px-4 pt-2 pb-1.5 shrink-0">
          <div className="flex flex-col gap-1.5">
            <div className="text-sm font-bold text-[#495057] tracking-wide">
              Account balance: <span className="text-[#1a1a2e]">ZAR {balFmt(balance)}</span>
            </div>
            <div className="text-sm font-bold text-[#495057] tracking-wide">
              Current balance: <span className="text-[#1a1a2e]">ZAR {balFmt(currentBalance)}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={() => setShowWallet(true)}
              className="px-3 py-1.5 bg-white border border-[#007bff] rounded-lg text-[#007bff] text-[10px] font-bold tracking-widest hover:bg-[#007bff10] transition-all"
            >
              ⬡ WALLET
            </button>
            <StreakFireBlocks userId={userId} />
          </div>
        </div>

        {/* ── Multiplier Cards ── */}
        <StreakMultipliers streak={currentStreak} />

        {/* ── Market + Symbol Selectors ── */}
        <div className="flex gap-2 px-4 pb-1.5 shrink-0">
          <div className="flex-1 relative">
            <button
              onClick={() => { setMarketOpen(o => !o); setSymbolOpen(false); }}
              className="w-full bg-white border border-[#e0e4e8] rounded-lg px-3 py-1.5 flex justify-between items-center text-xs text-[#495057] tracking-wide hover:border-[#007bff] transition-all"
            >
              {market} <span className="text-[9px] opacity-50">▼</span>
            </button>
            {marketOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e0e4e8] rounded-lg z-30 overflow-hidden shadow-lg">
                {Object.keys(SYMBOLS).map(m => (
                  <div key={m} onClick={() => changeMarket(m)} className="px-3 py-2 text-xs text-[#495057] hover:bg-[#f8f9fa] hover:text-[#007bff] cursor-pointer border-b border-[#e0e4e8] last:border-0 transition-colors">
                    {m}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 relative">
            <button
              onClick={() => { setSymbolOpen(o => !o); setMarketOpen(false); }}
              className="w-full bg-[#f5a623] border border-[#f5a623] rounded-lg px-3 py-1.5 flex justify-between items-center text-xs text-white font-bold tracking-wide hover:bg-[#e69500] transition-all"
            >
              {symbol} <span className="text-[9px] text-white/50">▼</span>
            </button>
            {symbolOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e0e4e8] rounded-lg z-30 overflow-hidden shadow-lg">
                {SYMBOLS[market].map(s => (
                  <div key={s} onClick={() => changeSymbol(s)} className="px-3 py-2 text-xs text-[#495057] hover:bg-[#f8f9fa] hover:text-[#f5a623] cursor-pointer border-b border-[#e0e4e8] last:border-0 transition-colors">
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Price + Change ── */}
        <div className="flex items-baseline gap-2 px-4 pb-1 shrink-0">
          <span className="text-xl font-bold text-[#f5a623] tracking-wider">
            {displayPrice > 0 ? displayPrice.toLocaleString('en-ZA', { minimumFractionDigits: 4 }) : '—'}
          </span>
          <span className={`text-[10px] font-bold ${Number(priceChange) >= 0 ? 'text-[#28a745]' : 'text-[#dc3545]'}`}>
            {Number(priceChange) >= 0 ? '+' : ''}{priceChange}%
          </span>
        </div>

        {/* ── Timeframe Selector ── */}
        <div className="flex gap-1 px-4 pb-1.5 shrink-0">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide transition-all ${
                timeframe === tf
                  ? 'bg-[#007bff] text-white'
                  : 'bg-[#f8f9fa] border border-[#e0e4e8] text-[#6c757d] hover:text-[#007bff] hover:border-[#007bff]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* ── Chart Area — fixed smaller height ── */}
        <div className="px-3 pb-1.5">
          <div className="bg-[#0a0a1e] border border-[#e0e4e8] rounded-xl overflow-hidden flex" style={{ height: '340px' }}>
            <DrawingToolbar activeTool={activeTool} onToolSelect={setActiveTool} />
            <div className="flex-1 min-w-0" style={{ height: '340px' }}>
              <CandleChart
                livePrice={livePrice}
                entry={entry}
                takeProfit={takeProfit}
                stopLoss={stopLoss}
                onEntryChange={setEntry}
                onTPChange={setTakeProfit}
                onSLChange={setStopLoss}
                isTradeActive={isCurrentTradeActive}
                showControls={showControls}
                activeTool={activeTool}
                onToolSelect={setActiveTool}
              />
            </div>
          </div>
        </div>

        {/* ── Open Positions Strip ── */}
        {(openTrades.length > 0 || pendingOrders.length > 0) && (
          <div className="px-4 pb-2 shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {pendingOrders.map(o => (
                <div key={`pending-${o.id}`} className="flex items-center gap-1.5 bg-[#f8f9fa] border border-[#e0e4e8] rounded-lg px-2.5 py-1.5 shrink-0 cursor-pointer hover:border-[#007bff] transition-colors">
                  <span className="text-[#6c757d] text-[9px]">⏳</span>
                  <span className={`text-[9px] font-bold ${o.direction === 'BUY' ? 'text-[#28a745]' : 'text-[#dc3545]'}`}>{o.direction === 'BUY' ? '▲' : '▼'}</span>
                  <span className="text-[#6c757d] text-[9px] tracking-wide">{o.symbol}</span>
                </div>
              ))}
              {openTrades.map(t => (
                <div key={`open-${t.id}`} onClick={() => handleCloseTrade(t.id)} className="flex items-center gap-1.5 bg-[#f8f9fa] border border-[#e0e4e8] rounded-lg px-2.5 py-1.5 shrink-0 cursor-pointer hover:border-[#28a745] transition-colors">
                  <span className={`text-[9px] font-bold ${t.direction === 'BUY' ? 'text-[#28a745]' : 'text-[#dc3545]'}`}>{t.direction === 'BUY' ? '▲' : '▼'}</span>
                  <span className="text-[#6c757d] text-[9px] tracking-wide">{t.symbol}</span>
                  <span className={`text-[9px] font-bold ${t.pnl >= 0 ? 'text-[#28a745]' : 'text-[#dc3545]'}`}>{t.pnl >= 0 ? '+' : ''}{t.pnl?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Show / Hide Controls Toggle ── */}
        <div className="flex justify-center py-1.5 shrink-0">
          <button
            onClick={() => setShowControls(c => !c)}
            className="flex items-center gap-1.5 px-4 py-1 bg-[#f8f9fa] border border-[#e0e4e8] rounded-full text-[#007bff] text-[9px] font-bold tracking-widest hover:bg-[#e9ecef] hover:border-[#007bff] transition-all"
          >
            <span className="text-[10px]">⚙</span>
            {showControls ? 'HIDE CONTROLS' : 'SHOW CONTROL PANELS'}
            <span
              className="text-[8px] transition-transform duration-300 inline-block"
              style={{ transform: showControls ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >▼</span>
          </button>
        </div>

        {/* Control Panel */}
        <div
          ref={controlPanelRef}
          className="shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: showControls ? `${CONTROL_PANEL_HEIGHT}px` : '0px',
          }}
        >
          <div className="bg-white border-t border-[#e0e4e8] rounded-t-2xl">
            {/* Drag handle */}
            <div
              onClick={() => setShowControls(false)}
              className="flex justify-center items-center pt-2 pb-1 cursor-pointer"
            >
              <div className="w-12 h-1 bg-[#e0e4e8] rounded-full" />
            </div>

            <div className="px-3 pb-3 pt-1 space-y-2.5">
              {/* Lot Size */}
              <div>
                <div className="text-[7px] text-[#6c757d] tracking-widest uppercase mb-1.5">Lot Size</div>
                <div className="flex gap-1.5">
                  {LOT_SIZES.map(ls => (
                    <button
                      key={ls.label}
                      onClick={() => setLotSize(ls)}
                      className={`flex-1 py-1.5 rounded-lg border transition-all ${
                        lotSize?.label === ls.label
                          ? 'bg-[#007bff] border-[#007bff] text-white'
                          : 'bg-white border-[#e0e4e8] text-[#6c757d] hover:border-[#007bff] hover:text-[#007bff]'
                      }`}
                    >
                      <div className="text-[8px] font-bold uppercase tracking-wider">{ls.label}</div>
                      <div className="text-[7px] opacity-50">{ls.sublabel}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume + Levels */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-[7px] text-[#6c757d] tracking-widest uppercase mb-1.5">Volume</div>
                  <div className="flex items-center justify-between bg-white border border-[#e0e4e8] rounded-lg px-2 py-1.5">
                    <button
                      onClick={() => setVolume(v => Math.max(1, v - 1))}
                      className="w-6 h-6 bg-[#f8f9fa] border border-[#e0e4e8] rounded text-[#495057] text-sm hover:border-[#007bff] transition-all flex items-center justify-center"
                    >−</button>
                    <span className="text-sm font-bold text-[#1a1a2e] w-5 text-center">{volume}</span>
                    <button
                      onClick={() => setVolume(v => v + 1)}
                      className="w-6 h-6 bg-[#f8f9fa] border border-[#e0e4e8] rounded text-[#495057] text-sm hover:border-[#007bff] transition-all flex items-center justify-center"
                    >+</button>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="text-[7px] text-[#6c757d] uppercase tracking-wider mb-1.5">Levels</div>
                  <div className="flex gap-1.5">
                    <div className="flex-1">
                      <div className="text-[6px] text-[#6c757d]">ENTRY</div>
                      <div className={`text-[9px] font-bold ${entry ? 'text-[#007bff]' : 'text-[#adb5bd]'}`}>{priceFmt(entry)}</div>
                      {profitCalc && <div className="text-[6px] text-[#28a745]">+{profitCalc.pips}p</div>}
                    </div>
                    <div className="flex-1">
                      <div className="text-[6px] text-[#6c757d]">TP</div>
                      <div className={`text-[9px] font-bold ${takeProfit ? 'text-[#28a745]' : 'text-[#adb5bd]'}`}>{priceFmt(takeProfit)}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[6px] text-[#6c757d]">SL</div>
                      <div className={`text-[9px] font-bold ${stopLoss ? 'text-[#dc3545]' : 'text-[#adb5bd]'}`}>{priceFmt(stopLoss)}</div>
                      {lossCalc && <div className="text-[6px] text-[#dc3545]">-{lossCalc.pips}p</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Set Levels */}
              <div>
                <div className="text-[7px] text-[#6c757d] tracking-widest uppercase mb-1.5">Set Levels</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'entry', label: 'ENTRY', activeClass: 'border-[#007bff] bg-[#007bff10] text-[#007bff]' },
                    { key: 'tp',    label: 'TP',    activeClass: 'border-[#28a745] bg-[#28a74510] text-[#28a745]' },
                    { key: 'sl',    label: 'SL',    activeClass: 'border-[#dc3545] bg-[#dc354510] text-[#dc3545]' },
                  ].map(btn => {
                    const isSet = btn.key === 'entry' ? !!entry : btn.key === 'tp' ? !!takeProfit : !!stopLoss;
                    return (
                      <button
                        key={btn.key}
                        onClick={() => handleLineBtn(btn.key)}
                        className={`py-1.5 rounded-lg border-2 text-center transition-all ${
                          isSet ? btn.activeClass : 'bg-white border-[#e0e4e8] text-[#adb5bd] hover:border-[#6c757d]'
                        }`}
                      >
                        <div className="text-sm font-bold">{isSet ? '✕' : '+'}</div>
                        <div className="text-[7px] uppercase tracking-wider">{btn.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BUY / SELL */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleTrade('BUY')}
                  disabled={!canBuy}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                    canBuy
                      ? 'bg-[#28a745] border-2 border-[#28a745] text-white hover:bg-[#218838] active:scale-[0.98]'
                      : 'bg-[#e9ecef] border-2 border-[#e0e4e8] text-[#adb5bd] opacity-50 cursor-not-allowed'
                  }`}
                >
                  ▲ BUY
                </button>
                <button
                  onClick={() => handleTrade('SELL')}
                  disabled={!canSell}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                    canSell
                      ? 'bg-[#dc3545] border-2 border-[#dc3545] text-white hover:bg-[#c82333] active:scale-[0.98]'
                      : 'bg-[#e9ecef] border-2 border-[#e0e4e8] text-[#adb5bd] opacity-50 cursor-not-allowed'
                  }`}
                >
                  SELL ▼
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <BottomNav active="trade" />

      {/* Modals remain unchanged */}
      {showWallet && (
        <WalletModal
          balance={balance}
          openTrades={openTrades}
          onDeposit={async n => { await walletAPI.deposit(n); await fetchWallet(); }}
          onWithdraw={async n => { await walletAPI.withdraw(n); await fetchWallet(); }}
          onCloseAll={handleCloseTrade}
          onClose={() => setShowWallet(false)}
        />
      )}

      {showActivationModal && activationDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#007bff] rounded-2xl max-w-sm w-full p-6">
            <div className="text-[#007bff] text-base font-bold mb-4 text-center tracking-widest uppercase">Trade Activated</div>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Symbol',      val: activationDetails.symbol,    cls: 'text-[#1a1a2e]' },
                { label: 'Direction',   val: activationDetails.direction === 'BUY' ? '▲ BUY' : '▼ SELL', cls: activationDetails.direction === 'BUY' ? 'text-[#28a745]' : 'text-[#dc3545]' },
                { label: 'Lot',         val: `${activationDetails.lot} × ${activationDetails.volume}`, cls: 'text-[#1a1a2e]' },
                { label: 'Entry Price', val: activationDetails.entryPrice, cls: 'text-[#007bff]' },
                { label: 'TP',          val: activationDetails.tp || '–', cls: 'text-[#28a745]' },
                { label: 'SL',          val: activationDetails.sl || '–', cls: 'text-[#dc3545]' },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-[#6c757d] tracking-wider">{row.label}</span>
                  <span className={`font-bold ${row.cls}`}>{row.val}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowActivationModal(false)} className="mt-5 w-full py-2.5 bg-[#f8f9fa] border border-[#e0e4e8] rounded-xl text-[#6c757d] text-xs tracking-widest hover:bg-[#e9ecef] transition-all">
              CLOSE
            </button>
          </div>
        </div>
      )}

      {showResultModal && resultDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`bg-white border-2 rounded-2xl max-w-sm w-full p-6 ${resultDetails.hit === 'TP' ? 'border-[#28a745]' : 'border-[#dc3545]'}`}>
            <div className={`text-base font-bold mb-4 text-center tracking-widest uppercase ${resultDetails.hit === 'TP' ? 'text-[#28a745]' : 'text-[#dc3545]'}`}>
              {resultDetails.hit === 'TP' ? 'Take Profit Hit' : 'Stop Loss Hit'}
            </div>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Symbol',    val: resultDetails.symbol,    cls: 'text-[#1a1a2e]' },
                { label: 'Direction', val: resultDetails.direction === 'BUY' ? '▲ BUY' : '▼ SELL', cls: resultDetails.direction === 'BUY' ? 'text-[#28a745]' : 'text-[#dc3545]' },
                { label: 'Entry',     val: resultDetails.entryPrice, cls: 'text-[#007bff]' },
                { label: 'Close',     val: resultDetails.closePrice, cls: 'text-[#1a1a2e]' },
                { label: 'Pips',      val: resultDetails.pips,       cls: resultDetails.pnl >= 0 ? 'text-[#28a745]' : 'text-[#dc3545]' },
                { label: 'P&L',       val: `${resultDetails.pnl >= 0 ? '+' : ''}${resultDetails.pnl.toFixed(2)} ZAR`, cls: resultDetails.pnl >= 0 ? 'text-[#28a745]' : 'text-[#dc3545]' },
              ].map(row => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-[#6c757d] tracking-wider">{row.label}</span>
                  <span className={`font-bold ${row.cls}`}>{row.val}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowResultModal(false)} className="mt-5 w-full py-2.5 bg-[#f8f9fa] border border-[#e0e4e8] rounded-xl text-[#6c757d] text-xs tracking-widest hover:bg-[#e9ecef] transition-all">
              CLOSE
            </button>
          </div>
        </div>
      )}

      {toast?.type === 'NOFUNDS' && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#dc3545] text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide z-50 border border-[#dc3545]">
          Insufficient funds — please deposit first.
        </div>
      )}
      {toast?.type === 'PENDING' && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#007bff] text-white px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide z-50 border border-[#007bff]">
          Order placed — waiting for entry...
        </div>
      )}
    </div>
  );
}

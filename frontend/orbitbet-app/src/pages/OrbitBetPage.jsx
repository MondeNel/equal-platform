import React, { useState, useEffect } from 'react';
import OrbitTicker from '../components/OrbitTicker';
import OrbitCanvas from '../components/OrbitCanvas';
import { useOrbitGame } from '../hooks/useOrbitGame';
import StreakStack from '../components/StreakStack';
import BottomNav from '../components/BottomNav';

const WALLET_API_URL = "http://localhost:8002/api/wallet";

export default function OrbitBetPage() {
  const [balance, setBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [stake, setStake] = useState(50);
  const [showResult, setShowResult] = useState(null);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  
  const { 
    currentRound, 
    status, 
    placeBet, 
    streak, 
    payoutData, 
    showFlash, 
    roundResults,
    xpGained
  } = useOrbitGame();

  // Get user ID from localStorage (same as trading dashboard)
  const getUserId = () => {
    const userJson = localStorage.getItem('equal_user');
    if (userJson) {
      try {
        return JSON.parse(userJson).id;
      } catch (e) {}
    }
    return '11111111-1111-1111-1111-111111111111';
  };
  const userId = getUserId();

  // Fetch wallet balance
  const fetchBalance = async () => {
    try {
      const response = await fetch(WALLET_API_URL, {
        headers: { 'X-User-ID': userId }
      });
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance);
        setAvailableBalance(data.available);
      }
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
    }
  };

  useEffect(() => {
    fetchBalance();
    // Poll every 5 seconds to keep balance updated
    const interval = setInterval(fetchBalance, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status === 'win') {
      setShowResult('WINNER!');
      fetchBalance(); // update balance after win
      setTimeout(() => setShowResult(null), 2000);
    } else if (status === 'loss') {
      setShowResult('LOSS');
      fetchBalance(); // update balance after loss
      setTimeout(() => setShowResult(null), 2000);
    }
  }, [status]);

  const handlePlaceBet = async (direction) => {
    // Check if user has enough available balance
    if (availableBalance < stake) {
      setInsufficientFunds(true);
      setTimeout(() => setInsufficientFunds(false), 3000);
      return;
    }
    await placeBet(direction, stake);
    // Balance will be updated via polling, but we can also fetch immediately
    fetchBalance();
  };

  return (
    <div className="min-h-screen bg-equal-bg font-mono relative overflow-hidden">
      
      {/* Streak Flash Overlay */}
      {showFlash && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-cyan-500/20 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
          <div className="relative z-10 text-center scale-125 px-4">
            <span className="text-[clamp(10px,3vw,12px)] text-white font-black tracking-[4px] uppercase block mb-2">
              STREAK BONUS UNLOCKED
            </span>
            <h1 className="text-[clamp(32px,8vw,48px)] font-black text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)] italic uppercase tracking-tighter">
              {streak} STREAK!
            </h1>
            {xpGained > 0 && (
              <div className="mt-4 bg-black/60 px-4 py-2 rounded-lg border border-yellow-400/50 inline-block">
                <span className="text-green-400 font-bold text-[clamp(11px,3vw,13px)]">+{xpGained} XP</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Insufficient Funds Toast */}
      {insufficientFunds && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg text-sm font-bold">
          Insufficient funds! Please deposit.
        </div>
      )}

      {/* Result Toast */}
      {showResult && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-black/90 border-2 border-yellow-400 rounded-xl px-[clamp(20px,5vw,32px)] py-[clamp(12px,3vw,16px)] animate-bounce">
          <span className={`text-[clamp(18px,5vw,24px)] font-black ${status === 'win' ? 'text-green-400' : 'text-red-400'}`}>
            {showResult}
          </span>
        </div>
      )}

      {/* Main content container with responsive max-width */}
      <div className="w-full max-w-[480px] mx-auto min-h-screen bg-black/70 backdrop-blur-xl flex flex-col border-x border-white/20 relative pb-[72px]">
        
        {/* Header Balance Bar */}
        <div className="flex justify-between items-center px-[clamp(12px,4vw,20px)] py-[clamp(8px,2.5vw,12px)] bg-white/5 border-b border-white/10">
          <div className="flex flex-col">
            <span className="text-[clamp(7px,2vw,8px)] text-cyan-400 font-black tracking-[2px] uppercase mb-0.5">
              ACCOUNT BALANCE
            </span>
            <span className="text-[clamp(12px,3.5vw,14px)] font-black text-white tracking-tight">
              ZAR {balance.toFixed(2)}
            </span>
            <span className="text-[clamp(7px,2vw,8px)] text-white/40">
              Available: ZAR {availableBalance.toFixed(2)}
            </span>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-[clamp(7px,2vw,8px)] text-white/30 font-black tracking-[2px] uppercase mb-0.5">
              POTENTIAL WIN
            </span>
            <span className="text-[clamp(12px,3.5vw,14px)] font-black text-green-400 tracking-tight">
              ZAR {payoutData ? payoutData.total.toFixed(2) : (stake * 1.85).toFixed(2)}
            </span>
          </div>
        </div>
        
        {/* Market Selectors */}
        <div className="flex gap-[clamp(8px,2vw,10px)] px-[clamp(12px,4vw,20px)] pt-[clamp(8px,2.5vw,12px)] pb-1">
          <div className="flex-1 bg-white/10 border border-white/10 rounded-lg px-[clamp(8px,2vw,12px)] py-[clamp(4px,1.5vw,6px)] flex justify-between items-center">
            <span className="text-[clamp(9px,2.5vw,10px)] text-white/80">Crypto</span>
            <span className="text-[clamp(7px,2vw,8px)] text-white/40">▼</span>
          </div>
          <div className="flex-1 bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-[clamp(8px,2vw,12px)] py-[clamp(4px,1.5vw,6px)] flex justify-between items-center">
            <span className="text-[clamp(9px,2.5vw,10px)] text-yellow-400 font-bold">BTC/USD</span>
          </div>
          <div className="flex items-center gap-[clamp(4px,1.5vw,6px)] bg-orange-500/20 px-[clamp(8px,2vw,10px)] py-[clamp(4px,1.5vw,6px)] rounded-lg border border-orange-500/30">
            <span className="text-[clamp(8px,2.5vw,9px)]">🔥</span>
            <span className="text-[clamp(11px,3vw,12px)] font-black text-orange-400">{streak}</span>
          </div>
        </div>

        {/* Streak Stack */}
        <div className="px-[clamp(12px,4vw,20px)] mt-2">
          <StreakStack 
            streakCount={streak} 
            currentRound={currentRound} 
            roundResults={roundResults} 
          />
        </div>

        {/* Price Ticker */}
        <div className="px-[clamp(12px,4vw,20px)] mt-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-[clamp(8px,2.5vw,12px)] backdrop-blur-sm shadow-inner relative overflow-hidden">
            <OrbitTicker 
              payoutData={payoutData} 
              isWin={status === 'win'} 
            />
          </div>
        </div>

        {/* Orbit Visualization - Responsive scaling */}
        <div className="flex flex-col items-center justify-center py-[clamp(8px,3vw,16px)]">
          <div className="relative" style={{ transform: `scale(${Math.min(window.innerWidth / 400, 1)})` }}>
            <OrbitCanvas 
              round={currentRound} 
              status={status === 'spinning' ? 'orbiting' : status} 
              roundResults={roundResults} 
            />
          </div>
          
          {/* Round Indicator */}
          {!payoutData && status !== 'win' && status !== 'loss' && status !== 'spinning' && (
            <div className="mt-2 text-center">
              <span className="text-[clamp(7px,2vw,8px)] text-cyan-400 tracking-[3px] uppercase font-bold">
                ROUND {currentRound} OF 3
              </span>
            </div>
          )}
          
          {status === 'spinning' && (
            <div className="mt-2 text-center">
              <span className="text-[clamp(7px,2vw,8px)] text-yellow-400 tracking-[3px] uppercase font-bold animate-pulse">
                SPINNING...
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="px-[clamp(12px,4vw,20px)] pb-6 mt-1">
          {/* Stake Selector */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-[clamp(8px,2.5vw,12px)] mb-3">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setStake(s => Math.max(10, s-10))} 
                disabled={status === 'spinning'}
                className="w-[clamp(36px,10vw,40px)] h-[clamp(36px,10vw,40px)] bg-white/10 rounded-lg text-white font-bold text-[clamp(20px,5vw,24px)] hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                −
              </button>
              <div className="text-center">
                <span className="text-[clamp(7px,2vw,8px)] text-white/40 block uppercase tracking-widest mb-0.5">
                  BET AMOUNT
                </span>
                <span className="text-[clamp(18px,5vw,24px)] font-black text-white">R {stake}</span>
              </div>
              <button 
                onClick={() => setStake(s => Math.min(10000, s+10))} 
                disabled={status === 'spinning'}
                className="w-[clamp(36px,10vw,40px)] h-[clamp(36px,10vw,40px)] bg-white/10 rounded-lg text-white font-bold text-[clamp(20px,5vw,24px)] hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                style={{ minWidth: '44px', minHeight: '44px' }}
              >
                +
              </button>
            </div>
          </div>
          
          {/* UP/DOWN Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={() => handlePlaceBet('UP')} 
              disabled={status === 'spinning'}
              className="flex-1 bg-green-500/20 border-2 border-green-500 rounded-xl py-[clamp(12px,3.5vw,14px)] text-green-400 font-black text-[clamp(11px,3vw,12px)] tracking-[4px] hover:bg-green-500 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase touch-manipulation"
              style={{ minHeight: '48px' }}
            >
              ▲ UP
            </button>
            <button 
              onClick={() => handlePlaceBet('DOWN')} 
              disabled={status === 'spinning'}
              className="flex-1 bg-red-500/20 border-2 border-red-500 rounded-xl py-[clamp(12px,3.5vw,14px)] text-red-400 font-black text-[clamp(11px,3vw,12px)] tracking-[4px] hover:bg-red-500 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase touch-manipulation"
              style={{ minHeight: '48px' }}
            >
              DOWN ▼
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="bet" />
    </div>
  );
}
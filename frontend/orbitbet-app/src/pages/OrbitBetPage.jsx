import React, { useState, useEffect } from 'react';
import OrbitTicker from '../components/OrbitTicker';
import OrbitCanvas from '../components/OrbitCanvas';
import { useOrbitGame } from '../hooks/useOrbitGame';
import StreakStack from '../components/StreakStack';
import BottomNav from '../components/BottomNav';

export default function OrbitBetPage() {
  const [balance] = useState(110.00);
  const [stake, setStake] = useState(50);
  const [showResult, setShowResult] = useState(null);
  
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

  // Show result message when round completes
  useEffect(() => {
    if (status === 'win') {
      setShowResult('WINNER!');
      setTimeout(() => setShowResult(null), 2000);
    } else if (status === 'loss') {
      setShowResult('LOSS');
      setTimeout(() => setShowResult(null), 2000);
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-equal-bg font-mono relative overflow-hidden">
      
      {/* Streak Flash Overlay */}
      {showFlash && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-cyan-500/20 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
          <div className="relative z-10 text-center scale-125">
            <span className="text-[12px] text-white font-black tracking-[4px] uppercase block mb-2">
              STREAK BONUS UNLOCKED
            </span>
            <h1 className="text-5xl font-black text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.8)] italic uppercase tracking-tighter">
              {streak} STREAK!
            </h1>
            {xpGained > 0 && (
              <div className="mt-4 bg-black/60 px-4 py-2 rounded-lg border border-yellow-400/50 inline-block">
                <span className="text-green-400 font-bold">+{xpGained} XP</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Result Toast */}
      {showResult && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-black/90 border-2 border-yellow-400 rounded-xl px-8 py-4 animate-bounce">
          <span className={`text-2xl font-black ${status === 'win' ? 'text-green-400' : 'text-red-400'}`}>
            {showResult}
          </span>
        </div>
      )}

      {/* Main content container with compact spacing */}
      <div className="max-w-[390px] mx-auto min-h-screen bg-black/70 backdrop-blur-xl flex flex-col border-x border-white/20 relative pb-[72px]">
        
        {/* Header Balance Bar - more compact */}
        <div className="flex justify-between items-center px-5 py-3 bg-white/5 border-b border-white/10">
          <div className="flex flex-col">
            <span className="text-[8px] text-cyan-400 font-black tracking-[2px] uppercase mb-0.5">
              ACCOUNT BALANCE
            </span>
            <span className="text-sm font-black text-white tracking-tight">
              ZAR {balance.toFixed(2)}
            </span>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-[8px] text-white/30 font-black tracking-[2px] uppercase mb-0.5">
              POTENTIAL WIN
            </span>
            <span className="text-sm font-black text-green-400 tracking-tight">
              ZAR {payoutData ? payoutData.total.toFixed(2) : (stake * 1.85).toFixed(2)}
            </span>
          </div>
        </div>
        
        {/* Market Selectors - more compact */}
        <div className="flex gap-2.5 px-5 pt-3 pb-1">
          <div className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 flex justify-between items-center">
            <span className="text-[10px] text-white/80">Crypto</span>
            <span className="text-[8px] text-white/40">▼</span>
          </div>
          <div className="flex-1 bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-3 py-1.5 flex justify-between items-center">
            <span className="text-[10px] text-yellow-400 font-bold">BTC/USD</span>
          </div>
          <div className="flex items-center gap-1.5 bg-orange-500/20 px-2.5 py-1.5 rounded-lg border border-orange-500/30">
            <span className="text-[9px]">🔥</span>
            <span className="text-xs font-black text-orange-400">{streak}</span>
          </div>
        </div>

        {/* Streak Stack - reduced margin */}
        <div className="px-5 mt-2">
          <StreakStack 
            streakCount={streak} 
            currentRound={currentRound} 
            roundResults={roundResults} 
          />
        </div>

        {/* Price Ticker - reduced padding */}
        <div className="px-5 mt-3">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm shadow-inner relative overflow-hidden">
            <OrbitTicker 
              payoutData={payoutData} 
              isWin={status === 'win'} 
            />
          </div>
        </div>

        {/* Orbit Visualization - smaller scale */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative scale-90">
            <OrbitCanvas 
              round={currentRound} 
              status={status === 'spinning' ? 'orbiting' : status} 
              roundResults={roundResults} 
            />
          </div>
          
          {/* Round Indicator */}
          {!payoutData && status !== 'win' && status !== 'loss' && status !== 'spinning' && (
            <div className="mt-2 text-center">
              <span className="text-[8px] text-cyan-400 tracking-[3px] uppercase font-bold">
                ROUND {currentRound} OF 3
              </span>
            </div>
          )}
          
          {status === 'spinning' && (
            <div className="mt-2 text-center">
              <span className="text-[8px] text-yellow-400 tracking-[3px] uppercase font-bold animate-pulse">
                SPINNING...
              </span>
            </div>
          )}
        </div>

        {/* Controls - compact */}
        <div className="px-5 pb-6 mt-1">
          {/* Stake Selector */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-3">
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setStake(s => Math.max(10, s-10))} 
                disabled={status === 'spinning'}
                className="w-10 h-10 bg-white/10 rounded-lg text-white font-bold text-xl hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                −
              </button>
              <div className="text-center">
                <span className="text-[8px] text-white/40 block uppercase tracking-widest mb-0.5">
                  BET AMOUNT
                </span>
                <span className="text-xl font-black text-white">R {stake}</span>
              </div>
              <button 
                onClick={() => setStake(s => Math.min(10000, s+10))} 
                disabled={status === 'spinning'}
                className="w-10 h-10 bg-white/10 rounded-lg text-white font-bold text-xl hover:bg-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>
          
          {/* UP/DOWN Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={() => placeBet('UP', stake)} 
              disabled={status === 'spinning'}
              className="flex-1 bg-green-500/20 border-2 border-green-500 rounded-xl py-3 text-green-400 font-black text-xs tracking-[4px] hover:bg-green-500 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase"
            >
              ▲ UP
            </button>
            <button 
              onClick={() => placeBet('DOWN', stake)} 
              disabled={status === 'spinning'}
              className="flex-1 bg-red-500/20 border-2 border-red-500 rounded-xl py-3 text-red-400 font-black text-xs tracking-[4px] hover:bg-red-500 hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase"
            >
              DOWN ▼
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Fixed at bottom */}
      <BottomNav active="bet" />
    </div>
  );
}
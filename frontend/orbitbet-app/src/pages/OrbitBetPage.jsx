import React, { useState } from 'react';
import OrbitTicker from '../components/OrbitTicker';
import OrbitCanvas from '../components/OrbitCanvas';
import { useOrbitGame } from '../hooks/useOrbitGame';
import StreakStack from '../components/StreakStack';

export default function OrbitBetPage() {
  const [balance] = useState(110.00);
  const [stake, setStake] = useState(50);
  
  const { currentRound, status, placeBet, streak = 0 } = useOrbitGame();
  const isBetting = status === 'betting';

  return (
    <div className="flex justify-center bg-transparent min-h-screen font-mono">
      
      <div className="w-full max-w-[390px] bg-black/70 backdrop-blur-xl min-h-[700px] flex flex-col border border-white/20 relative overflow-hidden rounded-[16px] shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* ATMOSPHERE LAYER */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 flex flex-col h-full">

          {/* --- HEADER BALANCE BAR --- */}
          <div className="flex justify-between items-center px-[18px] py-[14px] bg-white/5 border-b border-white/10">
            <div className="flex flex-col">
              <span className="text-[8px] text-cyan-400 font-black tracking-[2px] uppercase mb-0.5">Account Balance</span>
              <span className="text-[15px] font-black text-white tracking-tight">
                ZAR {balance.toFixed(2)}
              </span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-white/30 font-black tracking-[2px] uppercase mb-0.5">Potential Win</span>
              <span className="text-[15px] font-black text-green-400 tracking-tight">
                ZAR {(stake * 1.2).toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Dropdowns & Streak Indicator */}
          <div className="flex gap-[10px] px-[18px] pt-4 items-center">
            <div className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 flex justify-between items-center">
              <span className="text-[11px] text-white/80">Crypto</span>
              <span className="text-[9px] text-white/40">▼</span>
            </div>
            <div className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 flex justify-between items-center">
              <span className="text-[11px] text-yellow-400 font-bold">BTC/USD</span>
              <span className="text-[9px] text-white/40">▼</span>
            </div>
            {/* Moved Streak Counter here for better spacing since top bar changed */}
            <div className="flex items-center gap-2 bg-orange-500/20 px-3 py-2 rounded-lg border border-orange-500/30">
                <span className="text-[10px]">🔥</span>
                <span className="text-[12px] font-black text-orange-400">{streak}</span>
            </div>
          </div>

          {/* --- STREAK LADDER (Directly on top of spinning numbers) --- */}
          <div className="px-[18px] mt-6">
            <StreakStack streakCount={streak} />
            
            {/* The Spinning Numbers (Ticker) */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm shadow-inner relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-500/5 to-transparent pointer-events-none"></div>
               <OrbitTicker />
            </div>
          </div>

          {/* Orbit Visualization */}
          <div className="flex flex-col items-center flex-1 justify-center relative">
            <div className="relative scale-110">
               <OrbitCanvas round={currentRound} status={status} />
            </div>
            
            <div className="mt-8 flex gap-2">
              {[1, 2, 3].map((r) => (
                <div key={r} className={`w-8 h-1 rounded-full transition-all duration-500 ${
                  currentRound >= r ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-white/5'
                }`} />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="px-[18px] pb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
               <div className="flex justify-between items-center">
                  <button onClick={() => setStake(s => Math.max(10, s-10))} className="w-10 h-10 bg-white/10 rounded-lg text-white font-bold text-xl hover:bg-white/20 transition-all">-</button>
                  <div className="text-center">
                    <span className="text-[9px] text-white/40 block uppercase tracking-widest mb-1">Bet Amount</span>
                    <span className="text-2xl font-black text-white italic">R {stake}</span>
                  </div>
                  <button onClick={() => setStake(s => s+10)} className="w-10 h-10 bg-white/10 rounded-lg text-white font-bold text-xl hover:bg-white/20 transition-all">+</button>
               </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => placeBet('up')} className="flex-1 bg-green-500/20 border-2 border-green-500 rounded-xl py-4 text-green-400 font-black text-xs tracking-[4px] hover:bg-green-500 hover:text-black transition-all">UP</button>
              <button onClick={() => placeBet('down')} className="flex-1 bg-red-500/20 border-2 border-red-500 rounded-xl py-4 text-red-400 font-black text-xs tracking-[4px] hover:bg-red-500 hover:text-black transition-all">DOWN</button>
            </div>
          </div>

          <div className="bg-black/40 border-t border-white/10 py-4 px-8 flex justify-between items-center text-[9px] font-black text-white/30 tracking-widest uppercase">
             <span className="text-cyan-400">Bet</span>
             <span>Trade</span>
             <span>Arb</span>
             <span>Follow</span>
          </div>
        </div>
      </div>
    </div>
  );
}
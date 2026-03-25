import React, { useState } from 'react';
import OrbitTicker from '../components/OrbitTicker';
import OrbitCanvas from '../components/OrbitCanvas';
import { useOrbitGame } from '../hooks/useOrbitGame';

export default function OrbitBetPage() {
  const [balance] = useState(110.00);
  const [stake, setStake] = useState(50);
  
  const { currentRound, status, placeBet, streak = 0 } = useOrbitGame();
  const isBetting = status === 'betting';

  const milestones = [
    { count: 2, prize: "1.5x", color: "border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]" },
    { count: 4, prize: "2.0x", color: "border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.4)]" },
    { count: 6, prize: "5.0x", color: "border-pink-400 shadow-[0_0_15px_rgba(244,114,182,0.4)]" },
    { count: 8, prize: "JACKPOT", color: "border-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.5)]" },
  ];

  return (
    <div className="flex justify-center bg-transparent min-h-screen font-mono">
      
      <div className="w-full max-w-[390px] bg-black/70 backdrop-blur-xl min-h-[700px] flex flex-col border border-white/20 relative overflow-hidden rounded-[16px] shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* ATMOSPHERE LAYER */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 flex flex-col h-full">
          
          {/* Balance Bar */}
          <div className="flex justify-between items-center px-[18px] py-[14px] bg-white/5 border-b border-white/10">
            <span className="text-[13px] font-bold text-white">ZAR {balance.toFixed(2)}</span>
            <span className="text-[13px] font-bold text-green-400">ZAR {(stake * 1.2).toFixed(2)}</span>
          </div>

          {/* Pair Dropdowns */}
          <div className="flex gap-[10px] px-[18px] pt-3">
            <div className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 flex justify-between items-center">
              <span className="text-[11px] text-white/80">Crypto</span>
              <span className="text-[9px] text-white/40">▼</span>
            </div>
            <div className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 flex justify-between items-center">
              <span className="text-[11px] text-yellow-400 font-bold">BTC/USD</span>
              <span className="text-[9px] text-white/40">▼</span>
            </div>
          </div>

          {/* --- ENHANCED VISIBILITY STREAK LADDER --- */}
          <div className="px-[18px] pt-5">
            <div className="flex justify-between items-end mb-2.5">
               <span className="text-[9px] text-cyan-300 font-black tracking-[2px] uppercase">Streak Multipliers</span>
               <div className="flex items-center gap-1.5 bg-orange-500/20 px-2 py-0.5 rounded-full border border-orange-500/30">
                  <span className="text-[12px]">🔥</span>
                  <span className="text-[13px] font-black text-orange-400">{streak}</span>
               </div>
            </div>
            
            <div className="grid grid-cols-4 gap-2.5">
              {milestones.map((m) => (
                <div 
                  key={m.count} 
                  className={`h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all duration-300 ${
                    streak >= m.count 
                    ? `bg-white/20 ${m.color} scale-105` 
                    : 'bg-white/5 border-white/10 opacity-60'
                  }`}
                >
                  <span className={`text-[8px] font-black uppercase ${streak >= m.count ? 'text-white' : 'text-white/40'}`}>
                    {m.count} Wins
                  </span>
                  <span className={`text-[11px] font-black italic ${streak >= m.count ? 'text-white' : 'text-white/20'}`}>
                    {m.prize}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Price Ticker Card */}
          <div className="mx-[18px] mt-5 bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
            <OrbitTicker />
          </div>

          {/* Orbit Visualization */}
          <div className="flex flex-col items-center flex-1 justify-center">
            <div className="relative scale-110">
               <OrbitCanvas round={currentRound} status={status} />
            </div>
            
            <div className="mt-8 flex gap-2.5">
              {[1, 2, 3].map((r) => (
                <div key={r} className={`w-12 h-1.5 rounded-full transition-all duration-500 ${
                  currentRound >= r ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]' : 'bg-white/10'
                }`} />
              ))}
            </div>
          </div>

          {/* Stake Controls */}
          <div className="px-[18px] pb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4">
               <div className="flex justify-between items-center">
                  <button onClick={() => setStake(s => Math.max(10, s-10))} className="w-10 h-10 bg-white/10 rounded-lg text-white font-bold text-xl hover:bg-white/20 transition-colors">-</button>
                  <div className="text-center">
                    <span className="text-[10px] text-white/40 block uppercase tracking-widest mb-1">Amount</span>
                    <span className="text-2xl font-black text-white italic">R {stake}</span>
                  </div>
                  <button onClick={() => setStake(s => s+10)} className="w-10 h-10 bg-white/10 rounded-lg text-white font-bold text-xl hover:bg-white/20 transition-colors">+</button>
               </div>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => placeBet('up')} className="flex-1 bg-green-500/20 border-2 border-green-500 rounded-xl py-4 text-green-400 font-black text-xs tracking-[4px] hover:bg-green-500 hover:text-black transition-all">UP</button>
              <button onClick={() => placeBet('down')} className="flex-1 bg-red-500/20 border-2 border-red-500 rounded-xl py-4 text-red-400 font-black text-xs tracking-[4px] hover:bg-red-500 hover:text-black transition-all">DOWN</button>
            </div>
          </div>

          {/* Nav */}
          <div className="bg-black/40 border-t border-white/10 py-4 px-8 flex justify-between items-center text-[9px] font-black text-white/30 tracking-widest">
             <span className="text-cyan-400">BET</span>
             <span>TRADE</span>
             <span>ARB</span>
             <span>FOLLOW</span>
          </div>
        </div>
      </div>
    </div>
  );
}
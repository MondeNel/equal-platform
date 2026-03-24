import React, { useState } from 'react';
import OrbitTicker from '../components/OrbitTicker';
import OrbitCanvas from '../components/OrbitCanvas';
import { useOrbitGame } from '../hooks/useOrbitGame';

export default function OrbitBetPage() {
  const [balance] = useState(110.00);
  const [stake, setStake] = useState(50);
  const [streak] = useState(0);

  const { currentRound, status, placeBet } = useOrbitGame();

  return (
    <div className="flex justify-center bg-black min-h-screen font-mono">
      <div className="w-full max-w-[390px] bg-[#07080f] min-h-[700px] flex flex-col border border-[#1a1a2e] relative overflow-hidden rounded-[16px]">
        
        {/* Balance Bar */}
        <div className="flex justify-between items-center px-[18px] py-[14px] bg-[#0a0b14] border-b border-[#1a1a2e]">
          <span className="text-[13px] font-bold text-[#e8e8ff]">ZAR {balance.toFixed(2)}</span>
          <span className="text-[13px] font-bold text-[#22c55e]">ZAR {(stake * 1.2).toFixed(2)}</span>
        </div>

        {/* Pair Dropdowns */}
        <div className="flex gap-[10px] px-[18px] pt-3">
          <div className="flex-1 bg-[#0d0e1a] border border-[#2a2a4a] rounded-lg px-3 py-2 flex justify-between items-center">
            <span className="text-[11px] text-[#c8c8ee]">Crypto</span>
            <span className="text-[9px] text-[#5050a0]">▼</span>
          </div>
          <div className="flex-1 bg-[#0d0e1a] border border-[#2a2a4a] rounded-lg px-3 py-2 flex justify-between items-center">
            <span className="text-[11px] text-[#facc15] font-bold">BTC/USD</span>
            <span className="text-[9px] text-[#5050a0]">▼</span>
          </div>
        </div>

        {/* Streak & Progress Pips */}
        <div className="flex justify-between items-center px-[18px] pt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[#f97316]">🔥</span>
            <span className="text-[13px] font-bold text-[#f97316]">{streak}</span>
            <span className="text-[8px] text-[#5050a0] tracking-widest ml-1 uppercase">Streak</span>
          </div>
          <div className="flex gap-1.25">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-[#2a2a4a]" />
            ))}
          </div>
          <span className="text-[11px] text-[#5050a0] font-bold uppercase">8</span>
        </div>

        {/* Price Ticker Card */}
        <div className="mx-[18px] mt-3.5 bg-[#0a0b14] border border-[#2a1a00] rounded-xl p-3">
          <OrbitTicker />
        </div>

        {/* Orbit Visualization */}
        <div className="flex flex-col items-center pt-5">
          <span className="text-[8px] text-[#5050a0] tracking-[2px] mb-4 uppercase">Probability Orbit</span>
          <OrbitCanvas round={currentRound} status={status} />
          
          <div className="mt-3.5 text-[8px] text-[#5050a0] tracking-[2px] uppercase">Round {currentRound} of 3</div>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3].map((r) => (
              <div key={r} className={`w-2.5 h-2.5 rounded-full border transition-all ${
                currentRound === r ? 'bg-[#e8e8ff] border-[#e8e8ff] shadow-[0_0_6px_#ffffff44]' : 'bg-[#1a1a3a] border-[#2a2a5a]'
              }`} />
            ))}
          </div>

          {/* Status Legend */}
          <div className="mt-4 flex gap-2.5 items-center">
            <div className="flex items-center gap-1">
              <div className="w-[10px] h-[10px] rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e88]" />
              <span className="text-[8px] text-[#5050a0]">WIN</span>
            </div>
            <div className="w-[1px] h-3 bg-[#2a2a4a]" />
            <div className="flex items-center gap-1">
              <div className="w-[10px] h-[10px] rounded-full bg-[#ef4444] shadow-[0_0_6px_#ef444488]" />
              <span className="text-[8px] text-[#5050a0]">LOSS</span>
            </div>
            <div className="w-[1px] h-3 bg-[#2a2a4a]" />
            <div className="flex items-center gap-1">
              <div className="w-[10px] h-[10px] rounded-full bg-[#facc15] shadow-[0_0_6px_#facc1588]" />
              <span className="text-[8px] text-[#5050a0]">NEAR MISS</span>
            </div>
          </div>
        </div>

        {/* Stake Controls */}
        <div className="px-[18px] mt-auto pb-4">
          <div className="bg-[#0a0b14] border border-[#1a1a2e] rounded-xl p-3 mb-3">
             <div className="text-[8px] text-[#5050a0] mb-2 uppercase tracking-wider">Stake</div>
             <div className="flex justify-center items-center gap-6">
                <button onClick={() => setStake(s => Math.max(10, s-10))} className="w-9 h-9 bg-[#0d0e1a] border border-[#2a2a4a] rounded-lg text-[#c8c8ee] flex items-center justify-center">
                  <svg width="14" height="2" viewBox="0 0 14 2"><line x1="1" y1="1" x2="13" y2="1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
                <span className="text-xl font-bold text-[#e8e8ff]">R {stake}</span>
                <button onClick={() => setStake(s => s+10)} className="w-9 h-9 bg-[#0d0e1a] border border-[#2a2a4a] rounded-lg text-[#c8c8ee] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 14 14"><line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
             </div>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => placeBet('up')} className="flex-1 bg-[#052210] border-2 border-[#22c55e] rounded-xl py-3.5 text-[#22c55e] font-bold text-xs tracking-widest flex items-center justify-center gap-2">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><polyline points="2,10 7,4 12,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              UP
            </button>
            <button onClick={() => placeBet('down')} className="flex-1 bg-[#1a0508] border-2 border-[#ef4444] rounded-xl py-3.5 text-[#ef4444] font-bold text-xs tracking-widest flex items-center justify-center gap-2">
              DOWN
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><polyline points="2,4 7,10 12,4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="bg-[#07080f] border-t border-[#1a1a2e] py-2">
          <div className="grid grid-cols-5 text-[7px] font-bold">
            <div className="flex flex-col items-center gap-1 text-[#f97316] relative">
              <div className="w-8 h-8 rounded-lg bg-[#f9731622] border border-[#f9731666] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><polyline points="4,11 6,7 8,9 11,4" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <span>BET</span>
              <div className="absolute bottom-[-8px] w-5 h-[2px] bg-[#f97316] rounded-full" />
            </div>
            {['TRADE', 'ARB', 'FOLLOW', 'PROFILE'].map(tab => (
              <div key={tab} className="flex flex-col items-center gap-1 text-[#3a3a60]">
                <div className="w-8 h-8 rounded-lg bg-[#0d0d20] border border-[#2e2e58] flex items-center justify-center opacity-50" />
                <span>{tab}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
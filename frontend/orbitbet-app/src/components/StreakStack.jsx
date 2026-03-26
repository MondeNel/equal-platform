import React from 'react';

const StreakStack = ({ streakCount, currentRound, roundResults }) => {
  const milestones = [
    { wins: 18, multi: "18x", color: "border-orange-400 text-orange-400", bgActive: "bg-orange-500/30", glow: "shadow-[0_0_15px_rgba(251,146,60,0.5)]" },
    { wins: 15, multi: "15x", color: "border-pink-400 text-pink-400", bgActive: "bg-pink-500/30", glow: "shadow-[0_0_15px_rgba(244,114,182,0.5)]" },
    { wins: 12, multi: "12x", color: "border-purple-400 text-purple-400", bgActive: "bg-purple-500/30", glow: "shadow-[0_0_15px_rgba(192,132,252,0.5)]" },
    { wins: 9, multi: "9x", color: "border-indigo-400 text-indigo-400", bgActive: "bg-indigo-500/30", glow: "shadow-[0_0_15px_rgba(129,140,248,0.5)]" },
    { wins: 6, multi: "6x", color: "border-blue-400 text-blue-400", bgActive: "bg-blue-500/30", glow: "shadow-[0_0_15px_rgba(96,165,250,0.5)]" },
    { wins: 3, multi: "3x", color: "border-cyan-400 text-cyan-400", bgActive: "bg-cyan-500/30", glow: "shadow-[0_0_15px_rgba(34,211,238,0.5)]" },
  ].reverse();

  return (
    <div className="w-full">
      {/* Round Progress Bars */}
      <div className="flex justify-between gap-2 mb-3">
        {[1, 2, 3].map((r) => (
          <div key={r} className="flex-1 flex flex-col items-center">
            <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${
              roundResults[r-1] === 'win' ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]' :
              roundResults[r-1] === 'loss' ? 'bg-red-500 shadow-[0_0_8px_#f87171]' :
              currentRound === r ? 'bg-cyan-400/80 animate-pulse shadow-[0_0_8px_#22d3ee]' : 'bg-white/30'
            }`} />
            <span className="text-[8px] mt-1 font-bold text-white/60 uppercase tracking-wider">
              ROUND {r}
            </span>
          </div>
        ))}
      </div>

      {/* Streak Bonuses - Enhanced visibility */}
      <div className="flex flex-col-reverse gap-1.5">
        {milestones.map((m) => {
          const isActive = streakCount >= m.wins;
          return (
            <div 
              key={m.wins} 
              className={`
                h-9 px-3 rounded-lg border-2 flex items-center justify-between transition-all duration-500
                ${isActive 
                  ? `${m.bgActive} ${m.color} ${m.glow} backdrop-blur-sm scale-[1.02]` 
                  : 'bg-black/40 border-white/10 opacity-50'
                }
              `}
            >
              <span className={`text-[10px] font-black tracking-wider flex items-center gap-1.5 ${isActive ? 'text-white' : 'text-white/40'}`}>
                <span className="text-base">🔥</span>
                <span>{m.wins} WINS</span>
              </span>
              <span className={`text-[13px] font-black italic tracking-tighter ${isActive ? 'text-white drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]' : 'text-white/20'}`}>
                BONUS {m.multi}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Current streak indicator */}
      {streakCount > 0 && (
        <div className="mt-3 text-center">
          <span className="text-[9px] text-orange-400 font-black tracking-wider">
            🔥 CURRENT STREAK: {streakCount} 🔥
          </span>
        </div>
      )}
    </div>
  );
};

export default StreakStack;
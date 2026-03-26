import React from 'react';

const StreakStack = ({ streakCount, currentRound, roundResults }) => {
  const milestones = [
    { wins: 18, multi: "18x", color: "border-orange-400 text-orange-400" },
    { wins: 15, multi: "15x", color: "border-pink-400 text-pink-400" },
    { wins: 12, multi: "12x", color: "border-purple-400 text-purple-400" },
    { wins: 9, multi: "9x", color: "border-indigo-400 text-indigo-400" },
    { wins: 6, multi: "6x", color: "border-blue-400 text-blue-400" },
    { wins: 3, multi: "3x", color: "border-cyan-400 text-cyan-400" },
  ].reverse();

  return (
    <div className="w-full">
      {/* Round Progress Bars */}
      <div className="flex justify-between gap-2 mb-4">
        {[1, 2, 3].map((r) => (
          <div key={r} className="flex-1 flex flex-col items-center">
            <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${
              roundResults[r-1] === 'win' ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' :
              roundResults[r-1] === 'loss' ? 'bg-red-500' :
              currentRound === r ? 'bg-white/60 animate-pulse' : 'bg-white/20'
            }`} />
            <span className="text-[8px] mt-1 font-bold text-white/40 uppercase tracking-wider">
              ROUND {r}
            </span>
          </div>
        ))}
      </div>

      {/* Streak Bonuses */}
      <div className="flex flex-col-reverse gap-1.5">
        {milestones.map((m) => {
          const isActive = streakCount >= m.wins;
          return (
            <div 
              key={m.wins} 
              className={`
                h-10 px-4 rounded-lg border-2 flex items-center justify-between transition-all duration-500
                ${isActive 
                  ? `bg-white/20 ${m.color} border-${m.color.split('-')[1]}-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]` 
                  : 'bg-white/5 border-white/10 opacity-40'
                }
              `}
            >
              <span className={`text-[10px] font-black tracking-wider ${isActive ? 'text-white' : 'text-white/40'}`}>
                🔥 {m.wins} WINS
              </span>
              <span className={`text-[11px] font-black italic tracking-tighter ${isActive ? 'text-white' : 'text-white/20'}`}>
                BONUS {m.multi}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StreakStack;
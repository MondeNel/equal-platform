import React from 'react';

const StreakStack = ({ streakCount }) => {
  const milestones = [
    { wins: 18, multi: "18x", color: "border-orange-400 text-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.6)]" },
    { wins: 15, multi: "15x", color: "border-pink-400 text-pink-400 shadow-[0_0_20px_rgba(244,114,182,0.6)]" },
    { wins: 12, multi: "12x", color: "border-purple-400 text-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.6)]" },
    { wins: 9, multi: "9x", color: "border-indigo-400 text-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.6)]" },
    { wins: 6, multi: "6x", color: "border-blue-400 text-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.6)]" },
    { wins: 3, multi: "3x", color: "border-cyan-400 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)]" },
  ].reverse();

  return (
    <div className="flex flex-col-reverse gap-1.5 w-full max-w-[260px] mx-auto mb-6 select-none">
      {milestones.map((m) => {
        const isActive = streakCount >= m.wins;
        return (
          <div
            key={m.wins}
            className={`
              h-8 px-4 rounded-md border-2 flex items-center justify-between transition-all duration-500
              ${isActive 
                ? `bg-white/30 ${m.color} scale-105 z-10 brightness-125` 
                : 'bg-white/10 border-white/20 opacity-40'}
            `}
          >
            <span className={`text-[11px] font-black tracking-wider ${isActive ? 'text-white' : 'text-white/40'}`}>
              🔥 {m.wins} WINS
            </span>
            <span className={`text-[12px] font-black italic tracking-tighter ${isActive ? 'text-white' : 'text-white/20'}`}>
              BONUS {m.multi}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default StreakStack;
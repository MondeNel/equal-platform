import React from 'react';

const StreakLadder = ({ streak }) => {
  const prizes = [
    { count: 5, reward: "10x BONUS", color: "text-orange-500", glow: "shadow-orange-500/50" },
    { count: 4, reward: "5x MULTI", color: "text-yellow-400", glow: "shadow-yellow-400/40" },
    { count: 3, reward: "2x BOOST", color: "text-cyan-400", glow: "shadow-cyan-400/30" },
    { count: 2, reward: "1.5x", color: "text-indigo-300", glow: "" },
    { count: 1, reward: "LOCKED", color: "text-slate-600", glow: "" },
  ];

  return (
    <div className="flex flex-col gap-1.5 w-full px-6 py-4 bg-black/40 border-b border-white/5">
      <div className="flex justify-between items-end mb-1">
        <span className="text-[10px] font-black text-cyan-400 tracking-[3px] uppercase">Streak Bonus</span>
        <span className="text-xl font-black text-white italic">LVL {streak}</span>
      </div>
      
      <div className="grid grid-cols-5 gap-1.5">
        {prizes.reverse().map((p) => {
          const isActive = streak >= p.count;
          return (
            <div key={p.count} className={`
              relative h-12 rounded-lg border flex flex-col items-center justify-center transition-all duration-500
              ${isActive ? `bg-white/10 ${p.color} border-current ${p.glow} shadow-lg scale-105 z-10` : 'bg-black/20 border-white/5 text-white/20'}
            `}>
              <span className="text-[7px] font-black uppercase tracking-tighter mb-0.5">Win {p.count}</span>
              <span className="text-[9px] font-bold tracking-tight">{p.reward}</span>
              
              {/* Electric "Volt" Line if Active */}
              {isActive && (
                <div className="absolute inset-0 bg-current opacity-10 animate-pulse rounded-lg" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StreakLadder;
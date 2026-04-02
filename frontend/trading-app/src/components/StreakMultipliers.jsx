import React from 'react';

const MILESTONES = [
  { wins: 3, multiplier: 1.85 },
  { wins: 6, multiplier: 2.0 },
  { wins: 9, multiplier: 2.5 },
];

export default function StreakMultipliers({ streak = 0 }) {
  // Find the highest milestone reached (<= current streak)
  const activeMilestone = MILESTONES.reduce((prev, curr) => 
    streak >= curr.wins ? curr : prev, null
  );

  return (
    <div className="flex gap-2 px-4 pb-2">
      {MILESTONES.map((m) => {
        const isActive = activeMilestone && m.wins === activeMilestone.wins;
        return (
          <div
            key={m.wins}
            className={`flex-1 rounded-md px-1.5 py-1 text-center transition-all ${
              isActive
                ? 'bg-[#f97316]/20 border border-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.3)]'
                : 'bg-[#0a0a1e] border border-[#2e2e58]'
            }`}
          >
            <div className={`text-[10px] font-bold ${isActive ? 'text-[#f97316]' : 'text-[#facc15]/50'}`}>
              {m.wins}x
            </div>
            <div className="text-[11px] font-mono flex items-center justify-center gap-0.5">
              <span className="text-[10px]">🔥</span>
              <span className={isActive ? 'text-white' : 'text-white/50'}>
                {m.multiplier.toFixed(2)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
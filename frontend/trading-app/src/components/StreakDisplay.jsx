import React from 'react';
import { usePlayerStats } from '../hooks/usePlayerStats';

// Compact inline streak — renders individual 🔥 blocks + count
// Designed to sit under the WALLET button in the top-right corner
export default function StreakDisplay({ userId }) {
  const { stats, loading, error } = usePlayerStats(userId);

  if (loading) {
    return (
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-[13px] h-[13px] rounded-[3px] bg-[#1e1e3a] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !stats) return null;

  const streak = stats.win_streak ?? 0;
  const MAX_BLOCKS = 8;
  const displayBlocks = Math.min(streak, MAX_BLOCKS);
  const overflow = streak > MAX_BLOCKS ? streak - MAX_BLOCKS : 0;

  if (streak === 0) {
    return (
      <div className="h-[13px] px-1.5 rounded-[3px] bg-[#1e1e3a] border border-[#2e2e58] flex items-center justify-center">
        <span className="text-[6px] text-[#3a3a6a] tracking-wide">no streak</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {/* Individual fire blocks */}
      {Array.from({ length: displayBlocks }).map((_, i) => (
        <div
          key={i}
          className="w-[13px] h-[13px] rounded-[3px] bg-[#1a0800] border border-[#f97316]/50 flex items-center justify-center text-[7px] leading-none select-none"
        >
          🔥
        </div>
      ))}

      {/* +N overflow badge */}
      {overflow > 0 && (
        <div className="h-[13px] px-1 rounded-[3px] bg-[#f97316]/20 border border-[#f97316]/50 flex items-center justify-center">
          <span className="text-[6px] font-bold text-[#f97316]">+{overflow}</span>
        </div>
      )}

      {/* Count */}
      <span className="text-[7px] font-bold text-[#f97316]/60 ml-0.5">×{streak}</span>
    </div>
  );
}
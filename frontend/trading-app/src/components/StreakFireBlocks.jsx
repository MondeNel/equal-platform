import React from 'react';
import { usePlayerStats } from '../hooks/usePlayerStats';

export default function StreakFireBlocks({ userId }) {
  const { stats, loading, error } = usePlayerStats(userId);

  if (loading) {
    return (
      <div className="h-6 px-2 rounded bg-[#1e1e3a] animate-pulse flex items-center justify-center">
        <span className="text-[8px] text-[#3a3a6a]">---</span>
      </div>
    );
  }

  if (error || !stats) return null;

  const streak = stats.win_streak ?? 0;

  return (
    <div className="h-6 px-3 rounded-md bg-[#0d0820] border border-[#38bdf8]/30 flex items-center justify-center gap-1.5">
      <span className="text-[10px]">🔥</span>
      <span className="text-[10px] font-bold text-white">{streak}</span>
      <span className="text-[8px] text-[#38bdf8]/70 uppercase tracking-wider">streaks</span>
    </div>
  );
}
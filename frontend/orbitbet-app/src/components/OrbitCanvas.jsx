import React from 'react';
import { motion } from 'framer-motion';

export default function OrbitCanvas({ round = 1, status = 'idle' }) {
  // Pixel vertical offsets for planet on Ring 1, 2, and 3
  const verticalOffsets = [90, 60, 32];
  const currentY = verticalOffsets[round - 1] || verticalOffsets[0];

const getPlanetGradient = () => {
  // If the game just ended in a loss/near-miss, show that color
  if (status === 'win') return 'radial-gradient(circle at 35% 35%, #22c55e, #14532d)';
  if (status === 'loss') return 'radial-gradient(circle at 35% 35%, #ef4444, #7f1d1d)';
  if (status === 'near-miss') return 'radial-gradient(circle at 35% 35%, #facc15, #854d0e)';
  
  // Otherwise, planet is white while moving
  return 'radial-gradient(circle at 35% 35%, #ffffff, #888888)';
};

  const getPlanetShadow = () => {
    if (status === 'win') return '0 0 8px #22c55e88';
    if (status === 'loss') return '0 0 8px #ef444488';
    if (status === 'near-miss') return '0 0 8px #facc1588';
    return '0 0 8px #ffffff66';
  };

  return (
    <div className="relative w-[180px] h-[180px] flex items-center justify-center">
      {/* Dashed Rings */}
      <div className="absolute w-[180px] h-[180px] rounded-full border border-dashed border-[#2a2a4a]" />
      <div className="absolute w-[120px] h-[120px] rounded-full border border-dashed border-[#2a2a4a]" />
      <div className="absolute w-[64px] h-[64px] rounded-full border border-dashed border-[#2a2a4a]" />

      {/* Blue Animated Core */}
      <div className="absolute w-7 h-7 rounded-full bg-[#0a0b14] border-2 border-[#00d4ff44] animate-[glow-blue_2.5s_infinite]" />
      <div className="absolute w-4 h-4 rounded-full bg-[radial-gradient(circle_at_35%_35%,#00d4ff66,#003366)]" />

      {/* Skipping Planet */}
      <motion.div
        animate={{ y: -currentY }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="absolute top-[50%] left-[50%] ml-[-7px] mt-[-7px] w-3.5 h-3.5 rounded-full border border-white/60 z-10"
        style={{ 
          background: getPlanetGradient(),
          boxShadow: getPlanetShadow()
        }}
      />

      {/* Ring Labels */}
      <div className="absolute right-[-28px] h-full flex flex-col justify-center gap-0 font-bold text-[#5050a0] text-[7px] tracking-widest">
         <span style={{ transform: 'translateY(-48px)' }} className={round === 1 ? 'text-white' : ''}>R1</span>
         <span style={{ transform: 'translateY(-18px)' }} className={round === 2 ? 'text-white' : ''}>R2</span>
         <span style={{ transform: 'translateY(12px)' }} className={round === 3 ? 'text-white' : ''}>R3</span>
      </div>
    </div>
  );
}
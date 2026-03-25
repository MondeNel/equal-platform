import React from 'react';
import { motion } from 'framer-motion';

export default function OrbitCanvas({ round = 1, status = 'idle' }) {
  // R1 = 90px (Outer), R2 = 60px (Middle), R3 = 32px (Inner)
  const verticalOffsets = [90, 60, 32];
  
  // This is the key: it calculates the new position every time 'round' changes
  const currentY = verticalOffsets[round - 1] || verticalOffsets[0];

  const getPlanetGradient = () => {
    if (status === 'win') return 'radial-gradient(circle at 35% 35%, #22c55e, #14532d)';
    if (status === 'loss') return 'radial-gradient(circle at 35% 35%, #ef4444, #7f1d1d)';
    if (status === 'near-miss') return 'radial-gradient(circle at 35% 35%, #facc15, #854d0e)';
    return 'radial-gradient(circle at 35% 35%, #ffffff, #888888)';
  };

  return (
    <div className="relative w-[180px] h-[180px] flex items-center justify-center">
      {/* Static Rings */}
      <div className="absolute w-[180px] h-[180px] rounded-full border border-dashed border-[#2a2a4a]" />
      <div className="absolute w-[120px] h-[120px] rounded-full border border-dashed border-[#2a2a4a]" />
      <div className="absolute w-[64px] h-[64px] rounded-full border border-dashed border-[#2a2a4a]" />

      {/* Core */}
      <div className="absolute w-7 h-7 rounded-full bg-[#0a0b14] border-2 border-[#00d4ff44] animate-pulse" />

      {/* The Jumping Planet */}
      <motion.div
        // This triggers the movement when currentY changes
        animate={{ y: -currentY }} 
        transition={{ 
          type: "spring", 
          stiffness: 120, // Mechanical "snap" feel
          damping: 12 
        }}
        className="absolute w-3.5 h-3.5 rounded-full border border-white/60 z-10"
        style={{ 
          background: getPlanetGradient(),
          boxShadow: status !== 'idle' ? '0 0 15px currentColor' : '0 0 8px #ffffff66'
        }}
      />
    </div>
  );
}
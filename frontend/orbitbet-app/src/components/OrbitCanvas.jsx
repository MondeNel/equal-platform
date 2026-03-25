import React from 'react';

const OrbitCanvas = ({ round, status }) => {
  // Rings defined: [Outer, Inner]
  const rings = [
    { id: 2, size: 160 }, // Outer Ring
    { id: 1, size: 100 }  // Inner Ring
  ];
  const isWinner = status === 'win';

  return (
    <div className="relative w-[200px] h-[200px] flex items-center justify-center">
      
      {/* THE CORE (Center) */}
      <div className={`w-10 h-10 rounded-full z-20 transition-all duration-700 shadow-[0_0_30px_rgba(255,255,255,0.2)] ${
        isWinner ? 'bg-green-400 shadow-green-500/80 scale-125' : 'bg-white/10 border border-white/20'
      }`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-2 h-2 rounded-full ${isWinner ? 'bg-white animate-ping' : 'bg-cyan-400/40'}`} />
        </div>
      </div>

      {/* THE RINGS */}
      {rings.map((ring) => {
        // Logic: Round 1 activates the Outer Ring (id: 2). Round 2 activates Inner (id: 1).
        const isActive = (round === 1 && ring.id === 2) || (round === 2 && ring.id <= 2);
        const isCurrentActive = (round === 1 && ring.id === 2) || (round === 2 && ring.id === 1);

        return (
          <div
            key={ring.id}
            style={{ 
              width: `${ring.size}px`, 
              height: `${ring.size}px`,
              animationDuration: ring.id === 2 ? '8s' : '5s' 
            }}
            className={`absolute rounded-full border transition-all duration-1000 ${
              isActive 
                ? 'border-cyan-400/40 shadow-[0_0_20px_rgba(34,211,238,0.1)] animate-spin-slow' 
                : 'border-white/5'
            }`}
          >
            {/* THE DOT: Only shows on the specific ring of the current round */}
            {isCurrentActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_15px_#22d3ee] z-30">
                {/* Extra inner glow for the dot */}
                <div className="absolute inset-0 bg-cyan-400 rounded-full animate-pulse opacity-50" />
              </div>
            )}
          </div>
        );
      })}

      {/* Atmosphere Glow */}
      <div className="absolute w-[280px] h-[280px] bg-cyan-500/5 rounded-full blur-[70px] pointer-events-none" />
    </div>
  );
};

export default OrbitCanvas;
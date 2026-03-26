import React from 'react';

const OrbitCanvas = ({ round, status, roundResults }) => {
  const rings = [
    { id: 1, size: 160 }, // Outer
    { id: 2, size: 100 }  // Inner
  ];
  const isWinner = status === 'win';
  const isStep3 = round === 3;

  return (
    <div className="relative w-[200px] h-[200px] flex items-center justify-center">
      {/* THE CORE */}
      <div className={`w-12 h-12 rounded-full z-20 transition-all duration-700 border-2 ${
        isStep3 || roundResults[2] ? 'border-cyan-400 shadow-[0_0_30px_#22d3ee] scale-110' : 'border-white/10'
      } ${isWinner ? 'bg-green-400 border-green-300 shadow-[0_0_50px_#4ade80] scale-125' : 'bg-black/40'}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-3 h-3 rounded-full ${isWinner ? 'bg-white animate-ping' : isStep3 ? 'bg-cyan-400 animate-pulse' : 'bg-white/5'}`} />
        </div>
      </div>

      {/* THE RINGS */}
      {rings.map((ring) => {
        const isCompleted = roundResults[ring.id - 1] === 'win';
        const isActive = round >= ring.id || isCompleted;
        const isCurrentActive = round === ring.id && status === 'orbiting';

        return (
          <div
            key={ring.id}
            style={{ width: `${ring.size}px`, height: `${ring.size}px`, animationDuration: ring.id === 1 ? '10s' : '6s' }}
            className={`absolute rounded-full border transition-all duration-1000 ${
              isCompleted ? 'border-cyan-400 shadow-[0_0_15px_#22d3ee]' :
              isActive ? 'border-cyan-400/30 animate-spin-slow' : 'border-white/5'
            }`}
          >
            {isCurrentActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_20px_#22d3ee] z-30">
                <div className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-40" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrbitCanvas;
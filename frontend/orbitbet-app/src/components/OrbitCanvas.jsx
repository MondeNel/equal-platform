import React from 'react';

const OrbitCanvas = ({ round, status, roundResults }) => {
  // Responsive ring sizes based on viewport
  const getRingSizes = () => {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 480) {
      return { outer: 140, inner: 88 }; // Mobile
    } else if (screenWidth <= 768) {
      return { outer: 160, inner: 100 }; // Tablet
    } else {
      return { outer: 180, inner: 112 }; // Larger tablets
    }
  };
  
  const ringSizes = getRingSizes();
  const rings = [
    { id: 1, size: ringSizes.outer },
    { id: 2, size: ringSizes.inner }
  ];
  
  const isWinner = status === 'win';
  const isStep3 = round === 3;

  return (
    <div className="relative flex items-center justify-center" 
         style={{ width: `${ringSizes.outer + 40}px`, height: `${ringSizes.outer + 40}px` }}>
      {/* THE CORE */}
      <div className={`rounded-full z-20 transition-all duration-700 border-2 ${
        isStep3 || roundResults[2] ? 'border-cyan-400 shadow-[0_0_30px_#22d3ee] scale-110' : 'border-white/10'
      } ${isWinner ? 'bg-green-400 border-green-300 shadow-[0_0_50px_#4ade80] scale-125' : 'bg-black/40'}`}
      style={{ width: `${ringSizes.inner * 0.4}px`, height: `${ringSizes.inner * 0.4}px` }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`rounded-full ${isWinner ? 'bg-white animate-ping' : isStep3 ? 'bg-cyan-400 animate-pulse' : 'bg-white/5'}`}
               style={{ width: `${ringSizes.inner * 0.1}px`, height: `${ringSizes.inner * 0.1}px` }} />
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
            style={{ 
              width: `${ring.size}px`, 
              height: `${ring.size}px`,
              animationDuration: ring.id === 1 ? '10s' : '6s'
            }}
            className={`absolute rounded-full border transition-all duration-1000 ${
              isCompleted ? 'border-cyan-400 shadow-[0_0_15px_#22d3ee]' :
              isActive ? 'border-cyan-400/30 animate-spin-slow' : 'border-white/5'
            }`}
          >
            {isCurrentActive && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-[0_0_20px_#22d3ee] z-30"
                   style={{ width: `${ring.size * 0.03}px`, height: `${ring.size * 0.03}px`, minWidth: '8px', minHeight: '8px' }}>
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
import React from 'react';

export default function OrbitControls({ stake, setStake, onUp, onDown, disabled, currency = "R" }) {
  const adjustStake = (val) => {
    const next = stake + val;
    if (next >= 10 && next <= 10000) setStake(next);
  };

  return (
    <div className="w-full space-y-6 p-4">
      {/* Stake Selector */}
      <div className="bg-equal-panel border border-equal-border rounded-xl p-4 flex flex-col items-center">
        <span className="text-[9px] text-equal-dim tracking-widest uppercase mb-4 self-start">
          STAKE
        </span>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => adjustStake(-10)}
            className="w-12 h-12 rounded-lg border-2 border-equal-border text-white text-2xl flex items-center justify-center active:bg-white/10"
          >
            −
          </button>
          
          <div className="text-2xl font-bold text-white font-mono flex gap-2">
            <span className="text-equal-dim">{currency}</span>
            <span>{stake}</span>
          </div>

          <button 
            onClick={() => adjustStake(10)}
            className="w-12 h-12 rounded-lg border-2 border-equal-border text-white text-2xl flex items-center justify-center active:bg-white/10"
          >
            +
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          disabled={disabled}
          onClick={onUp}
          className="flex-1 h-16 bg-equal-green/10 border-2 border-equal-green rounded-xl flex items-center justify-center gap-2 group active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="text-equal-green text-lg font-bold">▲ UP</span>
        </button>

        <button
          disabled={disabled}
          onClick={onDown}
          className="flex-1 h-16 bg-equal-red/10 border-2 border-equal-red rounded-xl flex items-center justify-center gap-2 group active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="text-equal-red text-lg font-bold">DOWN ▼</span>
        </button>
      </div>
    </div>
  );
}
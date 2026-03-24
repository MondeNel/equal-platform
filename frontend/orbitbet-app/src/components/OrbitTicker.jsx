import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const DigitReel = ({ value, delay, globalTrigger }) => {
  const digitHeight = 46;
  const reel = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="bg-[#1a1200] border border-[#facc1544] rounded-[5px] w-[34px] h-[46px] relative overflow-hidden shadow-[inset_0_0_15px_rgba(250,204,21,0.1)]">
      <motion.div
        key={globalTrigger}
        initial={{ y: 0 }}
        animate={{ y: -(value + 10) * digitHeight }}
        transition={{ duration: 1.4, delay: delay, ease: [0.45, 0.05, 0.55, 0.95] }}
        className="flex flex-col items-center"
      >
        {reel.map((num, i) => (
          <div key={i} className="w-[34px] h-[46px] flex-shrink-0 flex items-center justify-center text-[26px] font-black text-[#facc15]">
            {num}
          </div>
        ))}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none" />
    </div>
  );
};

export default function OrbitTicker() {
  const [price, setPrice] = useState("674478");
  const [spinCount, setSpinCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const newPrice = (parseInt(price) + (Math.random() > 0.5 ? 1 : -1)).toString();
      setPrice(newPrice);
      setSpinCount(s => s + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [price]);

  return (
    <div className="flex flex-col items-center">
      <div className="text-[8px] text-[#5050a0] tracking-[3px] uppercase mb-3 font-bold">BTC / USD LIVE</div>
      <div className="flex items-center gap-[3px]">
        {price.split("").map((d, i) => (
          <React.Fragment key={i}>
            <DigitReel value={parseInt(d)} delay={i * 0.1} globalTrigger={spinCount} />
            {i === 2 && <span className="text-[#facc15] font-bold text-xl self-end pb-1">.</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
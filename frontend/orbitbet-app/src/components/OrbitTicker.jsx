import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const DigitReel = ({ value, delay, globalTrigger, color = "#facc15" }) => {
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
          <div key={i} style={{ color }} className="w-[34px] h-[46px] flex-shrink-0 flex items-center justify-center text-[26px] font-black">
            {num}
          </div>
        ))}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none" />
    </div>
  );
};

export default function OrbitTicker({ payoutData, isWin }) {
  const [price, setPrice] = useState("674478");
  const [displayDigits, setDisplayDigits] = useState("674478");

  // Logic: If we have a win, format the payout to 6 digits (padded with zeros)
  useEffect(() => {
    if (isWin && payoutData) {
      const amount = Math.floor(payoutData.total).toString().padStart(6, '0');
      setDisplayDigits(amount);
    } else {
      setDisplayDigits(price);
    }
  }, [isWin, payoutData, price]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newPrice = (parseInt(price) + (Math.random() > 0.5 ? 1 : -1)).toString();
      setPrice(newPrice);
    }, 5000);
    return () => clearInterval(interval);
  }, [price]);

  return (
    <div className="flex flex-col items-center">
      <div className={`text-[8px] tracking-[3px] uppercase mb-3 font-bold transition-colors ${isWin ? 'text-green-400' : 'text-[#5050a0]'}`}>
        {isWin ? "TOTAL PAYOUT ZAR" : "BTC / USD LIVE"}
      </div>
      <div className="flex items-center gap-[3px]">
        {displayDigits.split("").map((d, i) => (
          <React.Fragment key={i}>
            <DigitReel 
              value={parseInt(d)} 
              delay={i * 0.1} 
              globalTrigger={displayDigits} 
              color={isWin ? "#4ade80" : "#facc15"} 
            />
            {i === 2 && <span className={`${isWin ? 'text-green-400' : 'text-[#facc15]'} font-bold text-xl self-end pb-1`}>.</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
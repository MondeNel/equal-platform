import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const DigitReel = ({ value, delay, globalTrigger, color = "#facc15" }) => {
  const [digitHeight, setDigitHeight] = useState(46);
  const [digitWidth, setDigitWidth] = useState(34);
  const [fontSize, setFontSize] = useState(26);
  
  // Responsive sizing based on screen width
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width <= 480) {
        setDigitHeight(36);
        setDigitWidth(28);
        setFontSize(20);
      } else if (width <= 768) {
        setDigitHeight(42);
        setDigitWidth(32);
        setFontSize(24);
      } else {
        setDigitHeight(46);
        setDigitWidth(34);
        setFontSize(26);
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  const reel = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="bg-[#1a1200] border border-[#facc1544] rounded-[5px] relative overflow-hidden shadow-[inset_0_0_15px_rgba(250,204,21,0.1)]"
         style={{ width: `${digitWidth}px`, height: `${digitHeight}px` }}>
      <motion.div
        key={globalTrigger}
        initial={{ y: 0 }}
        animate={{ y: -(value + 10) * digitHeight }}
        transition={{ duration: 1.4, delay: delay, ease: [0.45, 0.05, 0.55, 0.95] }}
        className="flex flex-col items-center"
      >
        {reel.map((num, i) => (
          <div key={i} style={{ color, fontSize: `${fontSize}px`, width: `${digitWidth}px`, height: `${digitHeight}px` }} 
               className="flex-shrink-0 flex items-center justify-center font-black">
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
      <div className={`text-[clamp(7px,2vw,8px)] tracking-[3px] uppercase mb-3 font-bold transition-colors ${isWin ? 'text-green-400' : 'text-[#5050a0]'}`}>
        {isWin ? "TOTAL PAYOUT ZAR" : "BTC / USD LIVE"}
      </div>
      <div className="flex items-center gap-[clamp(2px,1vw,3px)] flex-wrap justify-center">
        {displayDigits.split("").map((d, i) => (
          <React.Fragment key={i}>
            <DigitReel 
              value={parseInt(d)} 
              delay={i * 0.1} 
              globalTrigger={displayDigits} 
              color={isWin ? "#4ade80" : "#facc15"} 
            />
            {i === 2 && <span className={`${isWin ? 'text-green-400' : 'text-[#facc15]'} font-bold text-[clamp(16px,4vw,20px)] self-end pb-1`}>.</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
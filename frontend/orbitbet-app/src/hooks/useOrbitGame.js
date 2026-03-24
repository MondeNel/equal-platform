import { useState, useCallback } from 'react';

export const useOrbitGame = () => {
  const [currentRound, setCurrentRound] = useState(1);
  const [status, setStatus] = useState('idle'); // idle, win, loss, near-miss
  const [isPlaying, setIsPlaying] = useState(false);
  const [roundResults, setRoundResults] = useState([null, null, null]);
  

  const placeBet = useCallback((direction) => {
    if (isPlaying || currentRound > 3) return;
    
    setIsPlaying(true);
    const roundIndex = currentRound - 1;

    setTimeout(() => {
      const isWin = Math.random() > 0.45;
      const newResults = [...roundResults];
      
      if (isWin) {
        newResults[roundIndex] = 'win';
        setRoundResults(newResults);
        
        if (currentRound < 3) {
          setCurrentRound(prev => prev + 1);
          setIsPlaying(false);
        } else {
          setStatus('win'); // Grand Prize!
          setTimeout(resetGame, 4000);
        }
      } else {
        const isNearMiss = Math.random() > 0.7;
        newResults[roundIndex] = isNearMiss ? 'near-miss' : 'loss';
        setRoundResults(newResults);
        setStatus(newResults[roundIndex]);
        setTimeout(resetGame, 4000);
      }
    }, 1500); 
  }, [currentRound, isPlaying, roundResults]);

  const resetGame = () => {
    setCurrentRound(1);
    setStatus('idle');
    setRoundResults([null, null, null]);
    setIsPlaying(false);
  };

  return { isPlaying, currentRound, status, roundResults, placeBet };
};
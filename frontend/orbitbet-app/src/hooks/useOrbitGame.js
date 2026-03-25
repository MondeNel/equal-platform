import { useState, useCallback, useEffect } from 'react';
import { orbitAPI } from '../api/orbitAPI';

export const useOrbitGame = () => {
  const [currentRound, setCurrentRound] = useState(1);
  const [status, setStatus] = useState('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [roundResults, setRoundResults] = useState([null, null, null]);
  const [activeBetId, setActiveBetId] = useState(null);

  // In production, this would come from your Auth context
  const TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

  // --- HELPER: Reset local state ---
  const resetGame = () => {
    setActiveBetId(null);
    setCurrentRound(1);
    setRoundResults([null, null, null]);
  };

  // --- RECOVERY: Check for active sessions on mount ---
  useEffect(() => {
    const recoverGame = async () => {
      try {
        const res = await orbitAPI.getActiveBet(TEST_USER_ID);
        
        if (res.data && res.data.active) {
          setActiveBetId(res.data.bet_id);
          // Set the UI to the current progress
          setCurrentRound(res.data.step + 1); 
          setRoundResults(res.data.results || [null, null, null]);
        }
      } catch (err) {
        console.error("Game recovery failed:", err);
      }
    };
    recoverGame();
  }, []);

  // --- ACTION: Place or Continue Bet ---
  const placeBet = useCallback(async (direction) => {
    if (isPlaying || (status !== 'idle' && status !== 'ready')) return;
    
    setIsPlaying(true);
    setStatus('orbiting'); // New status for visual spinning feedback

    try {
      let response;
      
      if (activeBetId) {
        // Continue existing 3-round sequence
        response = await orbitAPI.continueBet(activeBetId, TEST_USER_ID);
      } else {
        // Start fresh Round 1
        response = await orbitAPI.placeBet("BTC/USD", direction, 50, TEST_USER_ID);
      }
      
      const { result, step, bet_id } = response.data;

      // 1s delay to let the planet animation finish spinning
      setTimeout(() => {
        const isWin = result === 'WIN';
        const newResults = [...roundResults];
        
        // Update the specific dot for the round just played
        newResults[step - 1] = isWin ? 'win' : 'loss';
        setRoundResults(newResults);

        if (isWin) {
          if (step < 3) {
            // Move to next ring
            setActiveBetId(bet_id || activeBetId);
            setCurrentRound(step + 1);
            setStatus('idle'); 
          } else {
            // Final Round Win
            setStatus('win');
            setActiveBetId(null); 
          }
        } else {
          // Any loss ends the sequence
          setStatus('loss');
          setActiveBetId(null);
        }
        
        setIsPlaying(false);
      }, 1000);

    } catch (err) {
      console.error("Bet action failed:", err);
      setStatus('idle');
      setIsPlaying(false);
    }
  }, [isPlaying, status, activeBetId, roundResults]);

  return { 
    currentRound, 
    status, 
    isPlaying, 
    roundResults, 
    placeBet, 
    resetGame 
  };
};
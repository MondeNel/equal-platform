import { useState, useCallback, useEffect } from 'react';
import { orbitAPI } from '../api/orbitAPI';

export const useOrbitGame = () => {
  const [currentRound, setCurrentRound] = useState(1);
  const [status, setStatus] = useState('ready'); // ready, spinning, win, loss
  const [isPlaying, setIsPlaying] = useState(false);
  const [roundResults, setRoundResults] = useState([null, null, null]);
  const [activeBetId, setActiveBetId] = useState(null);
  const [streak, setStreak] = useState(0);
  const [payoutData, setPayoutData] = useState(null);
  const [showFlash, setShowFlash] = useState(false);
  const [xpGained, setXpGained] = useState(0);

  const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';

  // Check for active bet on load
  useEffect(() => {
    const checkActiveBet = async () => {
      try {
        const response = await orbitAPI.getActiveBet(TEST_USER_ID);
        if (response.data.has_active_bet) {
          const activeBet = response.data;
          setActiveBetId(activeBet.bet_id);
          setCurrentRound(activeBet.current_round);
          
          // Restore previous round results
          const results = [null, null, null];
          if (activeBet.round_1_result) results[0] = activeBet.round_1_result.toLowerCase();
          if (activeBet.round_2_result) results[1] = activeBet.round_2_result.toLowerCase();
          setRoundResults(results);
          
          setStatus('ready');
        }
      } catch (err) {
        console.error("Failed to check active bet:", err);
      }
    };
    
    checkActiveBet();
  }, []);

  const resetGame = () => {
    setActiveBetId(null);
    setCurrentRound(1);
    setRoundResults([null, null, null]);
    setStatus('ready');
    setShowFlash(false);
    setPayoutData(null);
    setXpGained(0);
  };

  const placeBet = useCallback(async (direction, stakeValue) => {
    // If game just ended, reset
    if (status === 'win' || status === 'loss') {
      resetGame();
    }

    // Prevent multiple clicks
    if (isPlaying || status === 'spinning') return;
    
    setIsPlaying(true);
    setStatus('spinning');

    try {
      let response;
      
      // If we have an active bet, resolve the next round
      if (activeBetId) {
        response = await orbitAPI.resolveRound(
          activeBetId, 
          direction.toUpperCase(), 
          TEST_USER_ID
        );
      } else {
        // Start new bet
        response = await orbitAPI.placeBet(
          "BTC/USD", 
          direction.toUpperCase(), 
          stakeValue, 
          TEST_USER_ID
        );
        setActiveBetId(response.data.bet_id);
      }
      
      const roundResult = response.data;
      
      // Update round result
      setTimeout(() => {
        const isWin = roundResult.result === 'WIN';
        
        setRoundResults(prev => {
          const updated = [...prev];
          updated[roundResult.round_number - 1] = isWin ? 'win' : 'loss';
          return updated;
        });
        
        if (roundResult.is_complete) {
          // Game finished
          if (roundResult.final_result === 'WIN') {
            setStatus('win');
            setPayoutData({
              stake: roundResult.payout / 1.85, // Approximate original stake
              multiplier: 1.85,
              total: roundResult.payout
            });
            if (roundResult.streak_stats) {
              setStreak(roundResult.streak_stats.win_streak);
              setXpGained(roundResult.streak_stats.xp_gained);
              if (roundResult.streak_stats.milestones_awarded > 0) {
                setShowFlash(true);
                setTimeout(() => setShowFlash(false), 3000);
              }
            }
          } else {
            setStatus('loss');
            if (roundResult.streak_stats) {
              setStreak(0);
              setXpGained(roundResult.streak_stats.xp_gained);
            }
          }
          setActiveBetId(null);
        } else {
          // Move to next round
          setCurrentRound(roundResult.next_round);
          setStatus('ready');
        }
        
        setIsPlaying(false);
      }, 800); // Shorter delay for better UX

    } catch (err) {
      console.error("Orbit action failed:", err);
      console.error("Error details:", err.response?.data);
      setStatus('ready');
      setIsPlaying(false);
    }
  }, [isPlaying, status, activeBetId]);

  return { 
    currentRound, 
    status, 
    isPlaying, 
    roundResults, 
    placeBet, 
    resetGame, 
    streak, 
    payoutData, 
    showFlash,
    xpGained
  };
};
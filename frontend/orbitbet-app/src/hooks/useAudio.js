// src/hooks/useAudio.js - Simple version if you need it
import { useEffect } from 'react';

export const useAudio = (status, currentRound, showFlash) => {
  useEffect(() => {
    // You can add sound effects here later
    if (status === 'win') {
      console.log('🎉 Win sound effect');
    } else if (status === 'loss') {
      console.log('💀 Loss sound effect');
    }
  }, [status, currentRound, showFlash]);
};
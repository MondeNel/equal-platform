import { useState } from 'react';
import axios from 'axios';

const API_BASE = "http://localhost:8000/api/bet"; // Points to Gateway

export const useBet = (userId) => {
    const [betId, setBetId] = useState(null);
    const [streak, setStreak] = useState(0);
    const [multiplier, setMultiplier] = useState(1.0);
    const [status, setStatus] = useState("IDLE");

    const placeBet = async (symbol, direction, stake) => {
        try {
            const res = await axios.post(`${API_BASE}/place`, 
                { symbol, direction, stake },
                { headers: { 'x-user-id': userId } }
            );
            
            setBetId(res.data.bet_id);
            setStreak(res.data.streak);
            setMultiplier(res.data.multiplier);
            return res.data;
        } catch (err) {
            console.error("Bet placement failed", err);
        }
    };

    const continueBet = async () => {
        try {
            const res = await axios.post(`${API_BASE}/continue`, 
                { bet_id: betId },
                { headers: { 'x-user-id': userId } }
            );
            
            // Critical: Update streak and multiplier after the 2nd ring resolves
            setStreak(res.data.streak);
            setMultiplier(res.data.multiplier);
            setStatus(res.data.status);
            return res.data;
        } catch (err) {
            console.error("Bet resolution failed", err);
        }
    };

    return { placeBet, continueBet, streak, multiplier, status };
};
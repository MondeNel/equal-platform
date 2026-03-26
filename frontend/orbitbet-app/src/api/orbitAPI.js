import axios from 'axios';

const API_BASE_URL = "http://localhost:8006/api/bet";

export const orbitAPI = {
  // Place a new bet
  placeBet: (symbol, direction, stake, userId) => 
    axios.post(`${API_BASE_URL}/place`, 
      { symbol, direction, stake }, 
      { headers: { 'X-User-ID': userId } }
    ),

  // Resolve a single round
  resolveRound: (betId, chosenDirection, userId) => 
    axios.post(`${API_BASE_URL}/round`, 
      { bet_id: betId, chosen_direction: chosenDirection }, 
      { headers: { 'X-User-ID': userId } }
    ),

  // Get active bet (for resume)
  getActiveBet: (userId) => 
    axios.get(`${API_BASE_URL}/active`, 
      { headers: { 'X-User-ID': userId } }
    ),

  // Get player stats
  getStats: (userId) => 
    axios.get(`${API_BASE_URL}/stats`, 
      { headers: { 'X-User-ID': userId } }
    ),

  // Get bet history
  getHistory: (userId) => 
    axios.get(`${API_BASE_URL}/history`, 
      { headers: { 'X-User-ID': userId } }
    ),
};
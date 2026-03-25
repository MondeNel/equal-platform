import api from "../../../auth-app/src/api"; 


export const orbitAPI = {
  placeBet: (symbol, direction, stake, userId) => 
    api.post("/api/bet/place", { symbol, direction, stake }, { headers: { 'x-user-id': userId } }),

  continueBet: (betId, userId) => 
    api.post("/api/bet/continue", { bet_id: betId }, { headers: { 'x-user-id': userId } }),

  getActiveBet: (userId) => 
    api.get("/api/bet/active", { headers: { 'x-user-id': userId } }),
};
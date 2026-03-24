import api from "../../../auth-app/src/api"; // Reusing your existing axios instance

export const orbitAPI = {
  // Starts the 3-round sequence on the backend
  placeBet: (symbol, direction, stake) => 
    api.post("/api/bet/place", { symbol, direction, stake }),

  // Polls for the current status of an ongoing bet
  getActiveBet: () => 
    api.get("/api/bet/active"),

  // Fetches user XP, Level, and Streaks
  getStats: () => 
    api.get("/api/bet/stats"),
};
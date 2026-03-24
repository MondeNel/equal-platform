import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const api  = axios.create({ baseURL: BASE });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("equal_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem("equal_token");
      localStorage.removeItem("equal_user");
      window.location.href = "http://localhost:5171/login";
    }
    return Promise.reject(err);
  }
);

export const walletAPI = {
  get: () => api.get("/api/wallet"),
};

export const subscriptionAPI = {
  me: () => api.get("/api/subscriptions/me").catch(() => null),
};

export default api;
import axios from "axios";

// Service URLs
const GATEWAY_URL = "http://10.115.92.1:8000";
const TRADING_URL = "http://10.115.92.1:8003";
const WALLET_URL = "http://10.115.92.1:8002";

// Create separate instances
const gatewayApi = axios.create({ baseURL: GATEWAY_URL });
const tradingApi = axios.create({ baseURL: TRADING_URL });
const walletApi = axios.create({ baseURL: WALLET_URL });

// Add auth interceptor with user ID
const addAuthInterceptor = (instance) => {
  instance.interceptors.request.use(cfg => {
    const token = localStorage.getItem("equal_token");
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    
    let userId = null;
    const user = localStorage.getItem("equal_user");
    if (user) {
      try {
        userId = JSON.parse(user).id;
      } catch (e) {}
    }
    if (!userId) {
      userId = '11111111-1111-1111-1111-111111111111';
      console.warn('No user ID found; using test ID');
    }
    cfg.headers['X-User-ID'] = userId;
    return cfg;
  });
};

addAuthInterceptor(gatewayApi);
addAuthInterceptor(tradingApi);
addAuthInterceptor(walletApi);

// --- Wallet API ---
export const walletAPI = {
  get: () => walletApi.get("/api/wallet"),
  deposit: (amount) => walletApi.post("/api/wallet/deposit", { amount }),
  withdraw: (amount) => walletApi.post("/api/wallet/withdraw", { amount }),
  transactions: () => walletApi.get("/api/wallet/transactions"),
};

// --- Prices API ---
export const pricesAPI = {
  get: (symbol) => tradingApi.get(`/api/prices/${symbol}`),
};

// --- Orders API ---
export const ordersAPI = {
  place: (data) => tradingApi.post("/api/orders/place", data),
  pending: () => tradingApi.get("/api/orders/pending"),
  cancel: (id) => tradingApi.delete(`/api/orders/${id}`),
  activate: (id, price) => tradingApi.post(`/api/orders/${id}/activate`, { activation_price: price }),
};

// --- Trades API ---
export const tradesAPI = {
  open: () => tradingApi.get("/api/trades/open"),
  close: (id, closePrice, reason) => tradingApi.post(`/api/trades/${id}/close`, {
    close_price: closePrice ?? null,
    close_reason: reason ?? "MANUAL",
  }),
  closeAll: () => tradingApi.post("/api/trades/close-all"),
  history: () => tradingApi.get("/api/trades/history"),
};

// --- Subscriptions API ---
export const subscriptionAPI = {
  plans: () => gatewayApi.get("/api/subscriptions/plans"),
  me: () => gatewayApi.get("/api/subscriptions/me"),
  upgrade: (plan) => gatewayApi.post("/api/subscriptions/upgrade", { plan }),
};

// --- Peter AI API ---
export const peterAPI = {
  analyse: (data) => tradingApi.post("/api/peter/analyse", data),
};

export default gatewayApi;
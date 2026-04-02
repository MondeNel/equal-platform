import axios from 'axios';

const GATEWAY_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const TRADING_URL = import.meta.env.VITE_TRADING_API_URL || "http://localhost:8003";
const WALLET_URL = import.meta.env.VITE_WALLET_API_URL || "http://localhost:8002";

const gatewayApi = axios.create({ baseURL: GATEWAY_URL });
const tradingApi = axios.create({ baseURL: TRADING_URL });
const walletApi = axios.create({ baseURL: WALLET_URL });

const addAuthInterceptor = (instance) => {
  instance.interceptors.request.use(cfg => {
    const user = localStorage.getItem('equal_user');
    let userId = '11111111-1111-1111-1111-111111111111';
    if (user) {
      try {
        userId = JSON.parse(user).id;
      } catch (e) {}
    }
    cfg.headers['X-User-ID'] = userId;
    const token = localStorage.getItem('equal_token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
  });
};

addAuthInterceptor(gatewayApi);
addAuthInterceptor(tradingApi);
addAuthInterceptor(walletApi);

export const walletAPI = {
  get: () => walletApi.get('/api/wallet'),
  deposit: (amount) => walletApi.post('/api/wallet/deposit', { amount }),
  withdraw: (amount) => walletApi.post('/api/wallet/withdraw', { amount }),
  transactions: () => walletApi.get('/api/wallet/transactions'),
};

export const pricesAPI = {
  get: (symbol) => tradingApi.get(`/api/prices/${symbol}`),
};

export const ordersAPI = {
  place: (data) => tradingApi.post('/api/orders/place', data),
  pending: () => tradingApi.get('/api/orders/pending'),
  cancel: (id) => tradingApi.delete(`/api/orders/${id}`),
  activate: (id, price) => tradingApi.post(`/api/orders/${id}/activate`, { activation_price: price }),
};

export const tradesAPI = {
  open: () => tradingApi.get('/api/trades/open'),
  close: (id, closePrice, reason) => tradingApi.post(`/api/trades/${id}/close`, {
    close_price: closePrice ?? null,
    close_reason: reason ?? 'MANUAL',
  }),
  history: () => tradingApi.get('/api/trades/history'),
};

export const statsAPI = {
  get: () => tradingApi.get('/api/stats'),
};

export default gatewayApi;
